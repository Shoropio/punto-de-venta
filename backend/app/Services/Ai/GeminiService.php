<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $model = 'gemini-2.0-flash-lite';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
    }

    /**
     * Send a conversational message and return Facturito's response.
     */
    public function chat(string $userMessage, array $history = []): string
    {
        if (! $this->apiKey) {
            return "⚙️ **Facturito no está activo:** Configura `GEMINI_API_KEY` en el archivo `.env` del backend para habilitarme. Soy tu asistente inteligente de facturación y ventas.";
        }

        $context = $this->buildContext();
        $systemPrompt = <<<PROMPT
Eres Facturito, el asistente inteligente del sistema POS Profesional de Costa Rica.
Respondes SOLO en español, de forma concisa, amigable y profesional.
Tienes acceso al contexto actual del negocio que se muestra a continuación:

{$context}

Puedes ayudar con:
- Consultas de ventas, inventario y facturas electrónicas.
- Estado de comprobantes ante Hacienda Costa Rica.
- Alertas de stock bajo y productos más vendidos.
- Explicar errores o conceptos de facturación electrónica DGT v4.4.

No inventes datos. Si algo no aparece en el contexto, dilo claramente.
PROMPT;

        $contents = [];
        foreach ($history as $msg) {
            $contents[] = ['role' => $msg['role'], 'parts' => [['text' => $msg['text']]]];
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $userMessage]]];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::timeout(30)->post($url, [
            'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
            'contents'           => $contents,
            'generationConfig'   => ['temperature' => 0.4, 'maxOutputTokens' => 512],
        ]);

        if ($response->failed()) {
            Log::error('Gemini API error: ' . $response->body());
            return "Lo siento, no pude conectarme con el servicio de IA en este momento. Por favor intenta de nuevo.";
        }

        return $response->json('candidates.0.content.parts.0.text')
            ?? "No pude generar una respuesta. Por favor reformula tu pregunta.";
    }

    /**
     * Build a sanitized business context to inject into the system prompt.
     */
    private function buildContext(): string
    {
        $lines = [];

        try {
            // Today's sales summary
            $today      = now()->toDateString();
            $salesToday = DB::table('sales')->whereDate('created_at', $today)->where('status', '!=', 'cancelled');
            $lines[]    = "Ventas hoy ({$today}): " . $salesToday->count() . " ventas, Total: ₡" . number_format((float) $salesToday->sum('total'), 2);

            // Payment method breakdown today
            $payments = DB::table('payments as p')
                ->join('sales as s', 's.id', '=', 'p.sale_id')
                ->whereDate('s.created_at', $today)
                ->where('s.status', '!=', 'cancelled')
                ->select('p.method', DB::raw('SUM(p.amount) as total'))
                ->groupBy('p.method')
                ->get();
            foreach ($payments as $p) {
                $lines[] = "  - " . ucfirst($p->method) . ": ₡" . number_format($p->total, 2);
            }

            // Low stock products
            $lowStock = DB::table('products')->where('is_active', true)->where('stock', '<=', 5)->orderBy('stock')->limit(5)->get(['name', 'stock', 'sku']);
            if ($lowStock->isNotEmpty()) {
                $lines[] = "Productos con stock bajo (≤5 unidades):";
                foreach ($lowStock as $p) {
                    $lines[] = "  - {$p->name} (SKU: {$p->sku}): {$p->stock} uds.";
                }
            }

            // Hacienda invoice status
            $pendingInvoices = DB::table('invoices')->whereIn('hacienda_status', ['pending_xml', 'xml_generated', 'pending', 'error'])->count();
            $acceptedInvoices = DB::table('invoices')->where('hacienda_status', 'accepted')->count();
            $lines[] = "Facturas electrónicas - Aceptadas: {$acceptedInvoices} | Pendientes/Error: {$pendingInvoices}";

            // Open cash session
            $cashSession = DB::table('cash_sessions')->whereNull('closed_at')->first();
            $lines[] = $cashSession ? "Caja actualmente abierta (sesión #{$cashSession->id})." : "Caja cerrada.";
        } catch (\Throwable $e) {
            $lines[] = "(Error al cargar contexto: {$e->getMessage()})";
        }

        return implode("\n", $lines);
    }
}
