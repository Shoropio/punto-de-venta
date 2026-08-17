<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private ?object $setting;

    public function __construct()
    {
        $this->setting = DB::table('whatsapp_settings')->where('is_active', true)->first();
    }

    /**
     * Send a text message to a phone number.
     * Phone must be in international format without +: e.g. "50688887777"
     */
    public function sendText(string $phone, string $message): array
    {
        if (! $this->setting) {
            Log::warning("WhatsApp no configurado. Mensaje no enviado a {$phone}.");
            return ['success' => false, 'reason' => 'WhatsApp no configurado. Configura el gateway en Configuracion > WhatsApp.'];
        }

        return $this->setting->driver === 'meta'
            ? $this->sendViaMeta($phone, $message)
            : $this->sendViaBaileys($phone, $message);
    }

    /**
     * Send an invoice notification with a download link.
     */
    public function sendInvoiceNotification(string $phone, string $customerName, string $folio, float $total, ?string $downloadUrl = null): array
    {
        $currency = 'CRC';
        $amount   = number_format($total, 2);
        $text     = "Hola {$customerName},\n\nTu factura electrónica #{$folio} por ₡{$amount} {$currency} ha sido procesada exitosamente.\n";
        if ($downloadUrl) {
            $text .= "\nDescarga tu comprobante: {$downloadUrl}";
        }
        $text .= "\n\n_POS Profesional_";

        return $this->sendText($phone, $text);
    }

    // ─── Private Drivers ────────────────────────────────────────────────────

    private function sendViaMeta(string $phone, string $message): array
    {
        $phoneNumberId = $this->setting->phone_number_id;
        $token         = $this->setting->access_token;

        if (! $phoneNumberId || ! $token) {
            return ['success' => false, 'reason' => 'Meta Cloud API: phone_number_id o access_token no configurados.'];
        }

        $response = Http::withToken($token)
            ->post("https://graph.facebook.com/v20.0/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to'                => $phone,
                'type'              => 'text',
                'text'              => ['body' => $message],
            ]);

        if ($response->successful()) {
            return ['success' => true, 'driver' => 'meta', 'message_id' => $response->json('messages.0.id')];
        }

        Log::error('WhatsApp Meta API error: ' . $response->body());
        return ['success' => false, 'driver' => 'meta', 'error' => $response->json('error.message') ?? $response->body()];
    }

    private function sendViaBaileys(string $phone, string $message): array
    {
        $endpoint = rtrim($this->setting->baileys_endpoint ?? '', '/');

        if (! $endpoint) {
            return ['success' => false, 'reason' => 'Baileys: endpoint no configurado.'];
        }

        $response = Http::post("{$endpoint}/send", [
            'phone'   => $phone . '@s.whatsapp.net',
            'message' => $message,
        ]);

        if ($response->successful()) {
            return ['success' => true, 'driver' => 'baileys', 'response' => $response->json()];
        }

        Log::error('WhatsApp Baileys error: ' . $response->body());
        return ['success' => false, 'driver' => 'baileys', 'error' => $response->body()];
    }
}
