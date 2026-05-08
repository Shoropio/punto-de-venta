<?php

namespace App\Services\Hacienda;

use App\Models\HaciendaSetting;
use App\Models\Invoice;
use DOMDocument;
use DOMElement;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class HaciendaXmlSigner
{
    private const DSIG_NS = 'http://www.w3.org/2000/09/xmldsig#';

    public function sign(Invoice $invoice): Invoice
    {
        if (! $invoice->xml_path || ! Storage::disk('local')->exists($invoice->xml_path)) {
            throw ValidationException::withMessages([
                'xml' => 'Genera el XML antes de firmar el comprobante.',
            ]);
        }

        $setting = HaciendaSetting::query()
            ->where(function ($query) use ($invoice) {
                $query->where('branch_id', $invoice->sale->branch_id)->orWhereNull('branch_id');
            })
            ->where('environment', config('services.hacienda.environment', 'staging'))
            ->where('is_active', true)
            ->orderByRaw('branch_id is null')
            ->first();

        if (! $setting?->certificate_path || ! $setting->certificate_pin) {
            throw ValidationException::withMessages([
                'certificate' => 'Configura certificado .p12 y PIN antes de firmar.',
            ]);
        }

        $certificate = $this->readCertificate($setting);
        $document = new DOMDocument('1.0', 'utf-8');
        $document->preserveWhiteSpace = false;
        $document->formatOutput = true;
        $document->loadXML(Storage::disk('local')->get($invoice->xml_path));

        $root = $document->documentElement;
        $digestValue = base64_encode(hash('sha256', $root->C14N(true, false), true));
        $signature = $this->buildSignature($document, $digestValue, $certificate['cert']);
        $signedInfo = $signature->getElementsByTagNameNS(self::DSIG_NS, 'SignedInfo')->item(0);

        openssl_sign($signedInfo->C14N(true, false), $signatureValue, $certificate['pkey'], OPENSSL_ALGO_SHA256);
        $signature->getElementsByTagNameNS(self::DSIG_NS, 'SignatureValue')->item(0)->nodeValue = base64_encode($signatureValue);
        $root->appendChild($signature);

        $path = "hacienda/signed/{$invoice->clave}.xml";
        Storage::disk('local')->put($path, $document->saveXML());

        $invoice->update([
            'signed_xml_path' => $path,
            'hacienda_status' => 'signed',
            'status' => 'signed',
        ]);

        return $invoice->fresh(['sale', 'customer']);
    }

    private function readCertificate(HaciendaSetting $setting): array
    {
        $contents = Storage::disk('local')->exists($setting->certificate_path)
            ? Storage::disk('local')->get($setting->certificate_path)
            : (@file_get_contents($setting->certificate_path) ?: null);

        if (! $contents || ! openssl_pkcs12_read($contents, $certificate, $setting->certificate_pin)) {
            throw ValidationException::withMessages([
                'certificate' => 'No fue posible leer el certificado .p12 con el PIN configurado.',
            ]);
        }

        return $certificate;
    }

    private function buildSignature(DOMDocument $document, string $digestValue, string $certificate): DOMElement
    {
        $signature = $document->createElementNS(self::DSIG_NS, 'ds:Signature');
        $signedInfo = $signature->appendChild($document->createElementNS(self::DSIG_NS, 'ds:SignedInfo'));
        $canonicalization = $signedInfo->appendChild($document->createElementNS(self::DSIG_NS, 'ds:CanonicalizationMethod'));
        $canonicalization->setAttribute('Algorithm', 'http://www.w3.org/2001/10/xml-exc-c14n#');
        $signatureMethod = $signedInfo->appendChild($document->createElementNS(self::DSIG_NS, 'ds:SignatureMethod'));
        $signatureMethod->setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');

        $reference = $signedInfo->appendChild($document->createElementNS(self::DSIG_NS, 'ds:Reference'));
        $reference->setAttribute('URI', '');
        $transforms = $reference->appendChild($document->createElementNS(self::DSIG_NS, 'ds:Transforms'));
        $enveloped = $transforms->appendChild($document->createElementNS(self::DSIG_NS, 'ds:Transform'));
        $enveloped->setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature');
        $canonical = $transforms->appendChild($document->createElementNS(self::DSIG_NS, 'ds:Transform'));
        $canonical->setAttribute('Algorithm', 'http://www.w3.org/2001/10/xml-exc-c14n#');
        $digestMethod = $reference->appendChild($document->createElementNS(self::DSIG_NS, 'ds:DigestMethod'));
        $digestMethod->setAttribute('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256');
        $reference->appendChild($document->createElementNS(self::DSIG_NS, 'ds:DigestValue', $digestValue));

        $signature->appendChild($document->createElementNS(self::DSIG_NS, 'ds:SignatureValue'));
        $keyInfo = $signature->appendChild($document->createElementNS(self::DSIG_NS, 'ds:KeyInfo'));
        $x509Data = $keyInfo->appendChild($document->createElementNS(self::DSIG_NS, 'ds:X509Data'));
        $x509Data->appendChild($document->createElementNS(self::DSIG_NS, 'ds:X509Certificate', $this->cleanCertificate($certificate)));

        return $signature;
    }

    private function cleanCertificate(string $certificate): string
    {
        return str_replace(["-----BEGIN CERTIFICATE-----", "-----END CERTIFICATE-----", "\r", "\n", ' '], '', $certificate);
    }
}
