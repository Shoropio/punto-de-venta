<?php

namespace App\Services\Pdf;

use App\Models\Invoice;
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
                    <td>{$product->name}</td>
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
                    <td>{$payment->method}</td>
                    <td class='right'>{$this->formatCurrency($payment->amount)}</td>
                    <td>{$payment->reference ?? '-'}</td>
                </tr>";
        }

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
        .qr-placeholder { text-align: center; margin: 15px 0; padding: 20px; border: 1px dashed #ccc; }
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
        <p><strong>Estado Hacienda:</strong> {$invoice->hacienda_status}</p>
    </div>

    <div class='section-title'>DATOS DEL EMISOR</div>
    <div class='fiscal-info'>
        <p><strong>Nombre:</strong> " . ($invoice->legal_name ?? '-') . "</p>
        <p><strong>Identificacion:</strong> " . ($invoice->tax_id ?? '-') . "</p>
    </div>

    " . ($customer ? "
    <div class='section-title'>DATOS DEL RECEPTOR</div>
    <div class='fiscal-info'>
        <p><strong>Nombre:</strong> {$customer->name}</p>
        <p><strong>Identificacion:</strong> " . ($customer->identification ?? '-') . "</p>
        <p><strong>Email:</strong> " . ($customer->email ?? '-') . "</p>
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

    <div class='qr-placeholder'>
        <p style='color: #999; font-size: 10px;'>[Codigo QR del comprobante fiscal]</p>
    </div>

    <div class='footer'>
        <p>Documento generado electronicamente por el sistema POS Profesional</p>
        <p>Hacienda Costa Rica - Facturacion Electronica v4.4</p>
    </div>
</body>
</html>";
    }

    private function formatCurrency(float $amount): string
    {
        return '₡' . number_format($amount, 2, ',', '.');
    }
}
