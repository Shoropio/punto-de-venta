<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\Notifications\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WhatsAppController extends Controller
{
    public function settings()
    {
        return DB::table('whatsapp_settings')->first();
    }

    public function saveSettings(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'driver' => ['required', 'in:meta,baileys'],
            'phone_number_id' => ['nullable', 'string', 'max:80'],
            'access_token' => ['nullable', 'string'],
            'baileys_endpoint' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $existing = DB::table('whatsapp_settings')->first();

        if ($existing) {
            DB::table('whatsapp_settings')->where('id', $existing->id)->update([
                ...$data,
                'updated_at' => now(),
            ]);
            $result = DB::table('whatsapp_settings')->where('id', $existing->id)->first();
        } else {
            $id = DB::table('whatsapp_settings')->insertGetId([
                ...$data,
                'is_active' => $data['is_active'] ?? false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $result = DB::table('whatsapp_settings')->find($id);
        }

        $activityLogger->log($request->user(), 'whatsapp.settings_updated', null, $data);

        return response()->json($result);
    }

    public function sendInvoice(Request $request, WhatsAppService $whatsapp, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'customer_name' => ['nullable', 'string', 'max:160'],
            'folio' => ['required', 'string', 'max:50'],
            'total' => ['required', 'numeric'],
            'download_url' => ['nullable', 'url'],
        ]);

        $result = $whatsapp->sendInvoiceNotification(
            $data['phone'],
            $data['customer_name'] ?? 'Cliente',
            $data['folio'],
            (float) $data['total'],
            $data['download_url'] ?? null,
        );

        $activityLogger->log($request->user(), 'whatsapp.invoice_sent', null, [
            'phone' => $data['phone'],
            'folio' => $data['folio'],
            'success' => $result['success'] ?? false,
        ]);

        return response()->json($result);
    }
}
