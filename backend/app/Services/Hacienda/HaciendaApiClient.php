<?php

namespace App\Services\Hacienda;

use App\Models\HaciendaSetting;
use App\Models\Invoice;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class HaciendaApiClient
{
    public function submit(Invoice $invoice): Invoice
    {
        $invoice->loadMissing(['sale.customer']);
        $setting = $this->setting($invoice);

        if (! $invoice->signed_xml_path || ! Storage::disk('local')->exists($invoice->signed_xml_path)) {
            throw ValidationException::withMessages([
                'signed_xml' => 'Firma el XML antes de enviarlo a Hacienda.',
            ]);
        }

        $response = $this->authorized($setting)
            ->acceptJson()
            ->post($this->url($setting, '/recepcion'), $this->payload($invoice, $setting));

        $data = [
            'submitted_at' => now(),
            'hacienda_status' => $response->created() ? 'submitted' : 'submit_failed',
            'status' => $response->created() ? 'submitted' : 'submit_failed',
            'hacienda_response' => [
                'status' => $response->status(),
                'headers' => [
                    'location' => $response->header('Location'),
                    'x_error_cause' => $response->header('X-Error-Cause'),
                ],
                'body' => $this->jsonOrText($response),
            ],
        ];

        $invoice->update($data);

        if ($response->failed()) {
            throw ValidationException::withMessages([
                'hacienda' => $response->header('X-Error-Cause') ?: 'Hacienda rechazo el envio del comprobante.',
            ]);
        }

        return $invoice->fresh(['sale', 'customer']);
    }

    public function checkStatus(Invoice $invoice): Invoice
    {
        $setting = $this->setting($invoice);
        $response = $this->authorized($setting)
            ->acceptJson()
            ->get($this->url($setting, '/recepcion/' . $invoice->clave));

        if ($response->failed()) {
            throw ValidationException::withMessages([
                'hacienda' => $response->header('X-Error-Cause') ?: 'No fue posible consultar el estado en Hacienda.',
            ]);
        }

        $body = $response->json() ?? [];
        $status = $this->normalizeStatus(data_get($body, 'ind-estado', data_get($body, 'indEstado', 'procesando')));
        $responsePath = null;

        if ($responseXml = data_get($body, 'respuesta-xml', data_get($body, 'respuestaXml'))) {
            $responsePath = "hacienda/responses/{$invoice->clave}.xml";
            Storage::disk('local')->put($responsePath, base64_decode($responseXml));
        }

        $invoice->update([
            'hacienda_status' => $status,
            'status' => $status,
            'hacienda_response_path' => $responsePath ?? $invoice->hacienda_response_path,
            'hacienda_response' => [
                'status' => $response->status(),
                'body' => $body,
            ],
            'accepted_at' => $status === 'accepted' ? now() : $invoice->accepted_at,
            'rejected_at' => in_array($status, ['rejected', 'error'], true) ? now() : $invoice->rejected_at,
        ]);

        return $invoice->fresh(['sale', 'customer']);
    }

    private function token(HaciendaSetting $setting): string
    {
        if (! $setting->api_username || ! $setting->api_password) {
            throw ValidationException::withMessages([
                'hacienda' => 'Configura usuario y password ATV para enviar a Hacienda.',
            ]);
        }

        try {
            $response = Http::asForm()
                ->acceptJson()
                ->post(config('services.hacienda.token_url'), [
                    'grant_type' => 'password',
                    'client_id' => $setting->environment === 'production'
                        ? config('services.hacienda.production_client_id')
                        : config('services.hacienda.staging_client_id'),
                    'username' => $setting->api_username,
                    'password' => $setting->api_password,
                ])
                ->throw();
        } catch (RequestException $exception) {
            throw ValidationException::withMessages([
                'hacienda' => 'No fue posible autenticar contra Hacienda.',
            ]);
        }

        return (string) $response->json('access_token');
    }

    private function authorized(HaciendaSetting $setting)
    {
        return Http::withToken($this->token($setting));
    }

    private function payload(Invoice $invoice, HaciendaSetting $setting): array
    {
        $payload = [
            'clave' => $invoice->clave,
            'fecha' => ($invoice->issued_at ?? now())->format('Y-m-d\TH:i:sO'),
            'emisor' => [
                'tipoIdentificacion' => $setting->identification_type,
                'numeroIdentificacion' => $setting->identification_number,
            ],
            'comprobanteXml' => base64_encode(Storage::disk('local')->get($invoice->signed_xml_path)),
        ];

        if ($setting->callback_url) {
            $payload['callbackUrl'] = $setting->callback_url;
        }

        if ($invoice->document_type !== '04') {
            $customer = $invoice->sale->customer;
            $payload['receptor'] = [
                'tipoIdentificacion' => $customer?->identification_type ?? data_get($invoice->metadata, 'identification_type', '02'),
                'numeroIdentificacion' => preg_replace('/\D+/', '', $customer?->identification_number ?? $invoice->tax_id),
            ];
        }

        return $payload;
    }

    private function setting(Invoice $invoice): HaciendaSetting
    {
        $invoice->loadMissing(['sale']);

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
                'hacienda' => 'Configura Hacienda Costa Rica v4.4 antes de enviar comprobantes.',
            ]);
        }

        return $setting;
    }

    private function url(HaciendaSetting $setting, string $path): string
    {
        $base = $setting->environment === 'production'
            ? config('services.hacienda.production_url')
            : config('services.hacienda.staging_url');

        return rtrim($base, '/') . '/' . ltrim($path, '/');
    }

    private function jsonOrText($response): mixed
    {
        return $response->json() ?? $response->body();
    }

    private function normalizeStatus(string $status): string
    {
        return match (strtolower($status)) {
            'aceptado' => 'accepted',
            'rechazado' => 'rejected',
            'error' => 'error',
            'recibido' => 'received',
            default => 'processing',
        };
    }
}
