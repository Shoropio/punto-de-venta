<?php

namespace App\Services\Hacienda;

use App\Models\HaciendaSetting;
use App\Models\Invoice;
use DOMDocument;
use DOMElement;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class HaciendaXmlGenerator
{
    private const ROOTS = [
        '01' => ['FacturaElectronica', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica'],
        '02' => ['NotaDebitoElectronica', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/notaDebitoElectronica'],
        '03' => ['NotaCreditoElectronica', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/notaCreditoElectronica'],
        '04' => ['TiqueteElectronico', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/tiqueteElectronico'],
        '08' => ['FacturaElectronicaCompra', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronicaCompra'],
        '09' => ['FacturaElectronicaExportacion', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronicaExportacion'],
        '10' => ['ReciboElectronicoPago', 'https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/reciboElectronicoPago'],
    ];

    private const PAYMENT_METHODS = [
        'cash' => '01',
        'card' => '02',
        'transfer' => '04',
        'credit' => '99',
    ];

    public function generate(Invoice $invoice): Invoice
    {
        $invoice->loadMissing(['sale.items.product', 'sale.payments', 'sale.customer']);

        $setting = HaciendaSetting::query()
            ->where(function ($query) use ($invoice) {
                $query->where('branch_id', $invoice->sale->branch_id)->orWhereNull('branch_id');
            })
            ->where('environment', config('services.hacienda.environment', 'staging'))
            ->where('is_active', true)
            ->orderByRaw('branch_id is null')
            ->first();

        if (! $setting) {
            throw ValidationException::withMessages([
                'hacienda' => 'Configura Hacienda Costa Rica v4.4 antes de generar XML.',
            ]);
        }

        [$rootName, $namespace] = self::ROOTS[$invoice->document_type] ?? throw ValidationException::withMessages([
            'document_type' => 'Tipo de comprobante Hacienda no soportado.',
        ]);

        $document = new DOMDocument('1.0', 'utf-8');
        $document->formatOutput = true;

        $root = $document->createElementNS($namespace, $rootName);
        $root->setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        $document->appendChild($root);

        $this->appendText($document, $root, 'Clave', $invoice->clave);
        $this->appendText($document, $root, 'CodigoActividadEmisor', $setting->economic_activity_code);
        $this->appendText($document, $root, 'NumeroConsecutivo', $invoice->numero_consecutivo);
        $this->appendText($document, $root, 'FechaEmision', ($invoice->issued_at ?? now())->toRfc3339String());
        $this->appendIssuer($document, $root, $setting);
        $this->appendReceiver($document, $root, $invoice);
        $this->appendText($document, $root, 'CondicionVenta', $this->conditionCode($invoice));
        $this->appendPaymentMethods($document, $root, $invoice);
        $this->appendServiceDetail($document, $root, $invoice);
        $this->appendSummary($document, $root, $invoice);
        $this->appendReference($document, $root, $invoice);

        $path = "hacienda/xml/{$invoice->clave}.xml";
        Storage::disk('local')->put($path, $document->saveXML());

        $invoice->update([
            'xml_path' => $path,
            'hacienda_status' => 'xml_generated',
            'status' => 'xml_generated',
        ]);

        return $invoice->fresh(['sale', 'customer']);
    }

    private function appendIssuer(DOMDocument $document, DOMElement $root, HaciendaSetting $setting): void
    {
        $issuer = $root->appendChild($document->createElement('Emisor'));
        $this->appendText($document, $issuer, 'Nombre', $setting->legal_name);

        $id = $issuer->appendChild($document->createElement('Identificacion'));
        $this->appendText($document, $id, 'Tipo', $setting->identification_type);
        $this->appendText($document, $id, 'Numero', $setting->identification_number);

        if ($setting->commercial_name) {
            $this->appendText($document, $issuer, 'NombreComercial', $setting->commercial_name);
        }

        $this->appendLocation($document, $issuer, $setting->province, $setting->canton, $setting->district, $setting->barrio, $setting->other_signs);

        if ($setting->phone) {
            $phone = $issuer->appendChild($document->createElement('Telefono'));
            $this->appendText($document, $phone, 'CodigoPais', $setting->country_code);
            $this->appendText($document, $phone, 'NumTelefono', preg_replace('/\D+/', '', $setting->phone));
        }

        $this->appendText($document, $issuer, 'CorreoElectronico', $setting->email);
    }

    private function appendReceiver(DOMDocument $document, DOMElement $root, Invoice $invoice): void
    {
        if ($invoice->document_type === '04') {
            return;
        }

        $customer = $invoice->sale->customer;
        $receiver = $root->appendChild($document->createElement('Receptor'));
        $this->appendText($document, $receiver, 'Nombre', $invoice->legal_name);

        $id = $receiver->appendChild($document->createElement('Identificacion'));
        $this->appendText($document, $id, 'Tipo', $customer?->identification_type ?? data_get($invoice->metadata, 'identification_type', '02'));
        $this->appendText($document, $id, 'Numero', preg_replace('/\D+/', '', $customer?->identification_number ?? $invoice->tax_id));

        if ($customer?->province && $customer?->canton && $customer?->district) {
            $this->appendLocation($document, $receiver, $customer->province, $customer->canton, $customer->district, $customer->barrio, $customer->other_signs ?? $customer->address ?? 'No indicada');
        }

        if ($invoice->email) {
            $this->appendText($document, $receiver, 'CorreoElectronico', $invoice->email);
        }
    }

    private function appendPaymentMethods(DOMDocument $document, DOMElement $root, Invoice $invoice): void
    {
        $methods = $invoice->sale->payments
            ->pluck('method')
            ->unique()
            ->values();

        foreach ($methods as $method) {
            $this->appendText($document, $root, 'MedioPago', self::PAYMENT_METHODS[$method] ?? '99');
        }
    }

    private function appendServiceDetail(DOMDocument $document, DOMElement $root, Invoice $invoice): void
    {
        $detail = $root->appendChild($document->createElement('DetalleServicio'));

        foreach ($invoice->sale->items as $index => $item) {
            $product = $item->product;
            $line = $detail->appendChild($document->createElement('LineaDetalle'));
            $lineBase = ((float) $item->quantity * (float) $item->unit_price) - (float) $item->discount_amount;

            $this->appendText($document, $line, 'NumeroLinea', (string) ($index + 1));
            $this->appendText($document, $line, 'CodigoCABYS', $product?->cabys_code ?? '0000000000000');
            $this->appendText($document, $line, 'Cantidad', $this->decimal($item->quantity, 3));
            $this->appendText($document, $line, 'UnidadMedida', $product?->hacienda_unit_code ?? 'Unid');
            $this->appendText($document, $line, 'Detalle', $item->product_name);
            $this->appendText($document, $line, 'PrecioUnitario', $this->decimal($item->unit_price));
            $this->appendText($document, $line, 'MontoTotal', $this->decimal((float) $item->quantity * (float) $item->unit_price));

            if ((float) $item->discount_amount > 0) {
                $discount = $line->appendChild($document->createElement('Descuento'));
                $this->appendText($document, $discount, 'MontoDescuento', $this->decimal($item->discount_amount));
                $this->appendText($document, $discount, 'NaturalezaDescuento', 'Descuento comercial');
            }

            $this->appendText($document, $line, 'SubTotal', $this->decimal($lineBase));

            if ((float) $item->tax_amount > 0) {
                $tax = $line->appendChild($document->createElement('Impuesto'));
                $this->appendText($document, $tax, 'Codigo', $product?->hacienda_tax_code ?? '01');
                $this->appendText($document, $tax, 'CodigoTarifa', $product?->hacienda_tax_rate_code ?? $this->taxRateCode((float) $item->tax_rate));
                $this->appendText($document, $tax, 'Tarifa', $this->decimal($item->tax_rate));
                $this->appendText($document, $tax, 'Monto', $this->decimal($item->tax_amount));
                $this->appendText($document, $line, 'ImpuestoNeto', $this->decimal($item->tax_amount));
            }

            $this->appendText($document, $line, 'MontoTotalLinea', $this->decimal($item->line_total));
        }
    }

    private function appendSummary(DOMDocument $document, DOMElement $root, Invoice $invoice): void
    {
        $summary = $root->appendChild($document->createElement('ResumenFactura'));
        $currency = $summary->appendChild($document->createElement('CodigoTipoMoneda'));
        $this->appendText($document, $currency, 'CodigoMoneda', 'CRC');
        $this->appendText($document, $currency, 'TipoCambio', '1.00000');

        $this->appendText($document, $summary, 'TotalMercanciasGravadas', $this->decimal($invoice->sale->subtotal));
        $this->appendText($document, $summary, 'TotalGravado', $this->decimal($invoice->sale->subtotal));
        $this->appendText($document, $summary, 'TotalVenta', $this->decimal($invoice->sale->subtotal));
        $this->appendText($document, $summary, 'TotalDescuentos', $this->decimal($invoice->sale->discount_total));
        $this->appendText($document, $summary, 'TotalVentaNeta', $this->decimal((float) $invoice->sale->subtotal - (float) $invoice->sale->discount_total));
        $this->appendText($document, $summary, 'TotalImpuesto', $this->decimal($invoice->sale->tax_total));
        $this->appendText($document, $summary, 'TotalComprobante', $this->decimal($invoice->sale->total));
    }

    private function appendReference(DOMDocument $document, DOMElement $root, Invoice $invoice): void
    {
        if (! in_array($invoice->document_type, ['02', '03', '10'], true)) {
            return;
        }

        $reference = $root->appendChild($document->createElement('InformacionReferencia'));
        $this->appendText($document, $reference, 'TipoDoc', data_get($invoice->metadata, 'reference_document_type', '01'));
        $this->appendText($document, $reference, 'Numero', data_get($invoice->metadata, 'reference_number', $invoice->sale->folio));
        $this->appendText($document, $reference, 'FechaEmision', data_get($invoice->metadata, 'reference_date', optional($invoice->sale->sold_at)->toRfc3339String() ?? now()->toRfc3339String()));
        $this->appendText($document, $reference, 'Codigo', data_get($invoice->metadata, 'reference_code', $invoice->document_type === '10' ? '04' : '01'));
        $this->appendText($document, $reference, 'Razon', data_get($invoice->metadata, 'reference_reason', $this->defaultReferenceReason($invoice->document_type)));
    }

    private function defaultReferenceReason(string $documentType): string
    {
        return match ($documentType) {
            '02' => 'Ajuste de debito sobre comprobante original',
            '03' => 'Correccion o anulacion sobre comprobante original',
            '10' => 'Recibo electronico de pago aplicado al comprobante original',
            default => 'Referencia al comprobante original',
        };
    }

    private function appendLocation(DOMDocument $document, DOMElement $parent, string $province, string $canton, string $district, ?string $barrio, string $otherSigns): void
    {
        $location = $parent->appendChild($document->createElement('Ubicacion'));
        $this->appendText($document, $location, 'Provincia', $province);
        $this->appendText($document, $location, 'Canton', $canton);
        $this->appendText($document, $location, 'Distrito', $district);
        if ($barrio) {
            $this->appendText($document, $location, 'Barrio', $barrio);
        }
        $this->appendText($document, $location, 'OtrasSenas', $otherSigns);
    }

    private function appendText(DOMDocument $document, DOMElement $parent, string $name, string|int|float|null $value): void
    {
        $parent->appendChild($document->createElement($name, htmlspecialchars((string) $value, ENT_XML1)));
    }

    private function conditionCode(Invoice $invoice): string
    {
        return $invoice->sale->payments->contains('method', 'credit') ? '02' : '01';
    }

    private function taxRateCode(float $rate): string
    {
        return match (round($rate, 2)) {
            0.0 => '01',
            1.0 => '02',
            2.0 => '03',
            4.0 => '04',
            8.0 => '07',
            13.0 => '08',
            default => '08',
        };
    }

    private function decimal(string|int|float $value, int $precision = 2): string
    {
        return number_format((float) $value, $precision, '.', '');
    }
}
