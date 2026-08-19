<?php

namespace App\Services\Pdf;

use App\Models\Invoice;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\PDF as DomPdf;
use Illuminate\Support\Facades\Log;

class PdfService
{
    public function __construct(
        private readonly DomPdf $pdf
    ) {}

    public function generateInvoicePdf(Invoice $invoice): ?string
    {
        try {
            $sale = $invoice->sale()->with(['items.product', 'payments', 'customer'])->first();
            if (! $sale) {
                Log::error('PDF: Sale not found for invoice', ['invoice_id' => $invoice->id]);
                return null;
            }

            $html = $this->buildInvoiceHtml($invoice, $sale);
            $pdfPath = storage_path("app/hacienda/pdf/invoice_{$invoice->id}.pdf");

            $dir = dirname($pdfPath);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $this->pdf->loadHtml($html);
            $this->pdf->setPaper('letter', 'portrait');
            $this->pdf->render();
            $this->pdf->output($pdfPath, 'F');

            return $pdfPath;
        } catch (\Throwable $e) {
            Log::error('PDF: Generation failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function buildInvoiceHtml(Invoice $invoice, $sale): string
    {
        $items = $sale->items ?? collect();
        $payments = $sale->payments ?? collect();
        $customer = $sale->customer;

        $itemsHtml = '';
        foreach ($items as $item) {
            $product = $item->product;
            $itemsHtml .= "
                <tr>
                    <td>" . htmlspecialchars((string) ($product->name ?? '')) . "</td>
                    <td class='right'>{$item->quantity}</td>
                    <td class='right'>{$this->formatCurrency($item->unit_price)}</td>
                    <td class='right'>{$this->formatCurrency($item->tax_amount)}</td>
                    <td class='right'>{$this->formatCurrency($item->line_total)}</td>
                </tr>";
        }

        $paymentsHtml = '';
        foreach ($payments as $payment) {
            $paymentsHtml .= "
                <tr>
                    <td>" . htmlspecialchars((string) $payment->method) . "</td>
                    <td class='right'>{$this->formatCurrency($payment->amount)}</td>
                    <td>" . htmlspecialchars((string) ($payment->reference ?? '-')) . "</td>
                </tr>";
        }

        $qrSvg = $this->generateQrSvg($invoice);

        return "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0088cc; padding-bottom: 15px; margin-bottom: 15px; }
        .header h1 { color: #0088cc; margin: 0; font-size: 18px; }
        .header p { margin: 2px 0; color: #666; }
        .fiscal-info { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 11px; }
        .fiscal-info strong { color: #0088cc; }
        .section-title { font-weight: bold; font-size: 13px; margin: 15px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #0088cc; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
        .right { text-align: right; }
        .total-row { font-weight: bold; background: #f0f0f0; }
        .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
        .qr-section { text-align: center; margin: 15px 0; }
        .qr-section svg { width: 120px; height: 120px; }
        @page { margin-bottom: 40px; }
        .page-footer { text-align: center; font-size: 9px; color: #aaa; position: fixed; bottom: 10px; width: 100%; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>FACTURA ELECTRONICA</h1>
        <p>Comprobante fiscal electronico - Hacienda Costa Rica v4.4</p>
    </div>

    <div class='fiscal-info'>
        <p><strong>Clave:</strong> {$invoice->clave}</p>
        <p><strong>Numero Consecutivo:</strong> {$invoice->numero_consecutivo}</p>
        <p><strong>Fecha Emision:</strong> {$invoice->issued_at?->format('d/m/Y H:i:s') ?? '-'}</p>
        <p><strong>Estado Hacienda:</strong> " . htmlspecialchars((string) $invoice->hacienda_status) . "</p>
    </div>

    <div class='section-title'>DATOS DEL EMISOR</div>
    <div class='fiscal-info'>
        <p><strong>Nombre:</strong> " . htmlspecialchars((string) ($invoice->legal_name ?? '-')) . "</p>
        <p><strong>Identificacion:</strong> " . htmlspecialchars((string) ($invoice->tax_id ?? '-')) . "</p>
    </div>

    " . ($customer ? "
    <div class='section-title'>DATOS DEL RECEPTOR</div>
    <div class='fiscal-info'>
        <p><strong>Nombre:</strong> " . htmlspecialchars((string) $customer->name) . "</p>
        <p><strong>Identificacion:</strong> " . htmlspecialchars((string) ($customer->identification_number ?? '-')) . "</p>
        <p><strong>Email:</strong> " . htmlspecialchars((string) ($customer->email ?? '-')) . "</p>
    </div>" : '') . "

    <div class='section-title'>DETALLE</div>
    <table>
        <thead>
            <tr><th>Descripcion</th><th class='right'>Cant.</th><th class='right'>Precio Unit.</th><th class='right'>Impuesto</th><th class='right'>Total Linea</th></tr>
        </thead>
        <tbody>
            {$itemsHtml}
        </tbody>
        <tfoot>
            <tr class='total-row'><td colspan='4'>Subtotal</td><td class='right'>{$this->formatCurrency($sale->subtotal)}</td></tr>
            <tr class='total-row'><td colspan='4'>Impuesto (13%)</td><td class='right'>{$this->formatCurrency($sale->tax_total)}</td></tr>
            <tr class='total-row'><td colspan='4'>TOTAL</td><td class='right'>{$this->formatCurrency($sale->total)}</td></tr>
        </tfoot>
    </table>

    <div class='section-title'>FORMAS DE PAGO</div>
    <table>
        <thead><tr><th>Metodo</th><th class='right'>Monto</th><th>Referencia</th></tr></thead>
        <tbody>{$paymentsHtml}</tbody>
    </table>

    <div class='qr-section'>
        {$qrSvg}
    </div>

    <div class='footer'>
        <p>Documento generado electronicamente por el sistema POS Profesional</p>
        <p>Hacienda Costa Rica - Facturacion Electronica v4.4</p>
    </div>
</body>
</html>";
    }

    private function generateQrSvg(Invoice $invoice): string
    {
        try {
            $qrContent = "https://catalogo.respuestadev.hacienda.go.cr反应" .
                "?ncomprobante={$invoice->numero_consecutivo}" .
                "&fechacomprobante={$invoice->issued_at?->format('Y-m-d')}" .
                "&emisor={$invoice->tax_id}" .

                "&receptor=" . ($invoice->sale?->customer?->identification_number ?? '000000000') .

                "&totalcomprobante=" . number_format((float) ($invoice->sale?->total ?? 0), 2, '.', '');

            $renderer = new ImageRenderer(
                new RendererStyle(190),
                new SvgImageBackEnd()
            );
            $writer = new Writer($renderer);

            return $writer->writeString($qrContent);
        } catch (\Throwable $e) {
            Log::warning('PDF: QR generation failed, using fallback', ['error' => $e->getMessage()]);
            return '<p style="color: #999; font-size: 10px;">[QR no disponible]</p>';
        }
    }

    private function formatCurrency(float $amount): string
    {
        return "\xC2\xA2" . number_format($amount, 2, ',', '.');
    }
}
