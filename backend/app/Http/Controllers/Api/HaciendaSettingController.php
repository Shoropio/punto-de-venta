<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HaciendaSetting;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HaciendaSettingController extends Controller
{
    public function index(Request $request)
    {
        return HaciendaSetting::query()
            ->when($request->query('branch_id'), fn ($query, $branchId) => $query->where('branch_id', $branchId))
            ->orderByDesc('is_active')
            ->orderBy('environment')
            ->get();
    }

    public function store(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $data = $this->validatePayload($request);

        $setting = HaciendaSetting::updateOrCreate(
            [
                'branch_id' => $data['branch_id'] ?? null,
                'environment' => $data['environment'],
            ],
            $data,
        );

        $activityLogger->log($request->user(), 'hacienda_setting.saved', $setting, [
            'branch_id' => $setting->branch_id,
            'environment' => $setting->environment,
            'schema_version' => $setting->schema_version,
            'is_active' => $setting->is_active,
        ]);

        return $setting;
    }

    public function update(Request $request, HaciendaSetting $haciendaSetting, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $before = $haciendaSetting->only(['environment', 'schema_version', 'legal_name', 'identification_number', 'is_active']);
        $haciendaSetting->update($this->validatePayload($request));
        $activityLogger->log($request->user(), 'hacienda_setting.updated', $haciendaSetting, [
            'before' => $before,
            'after' => $haciendaSetting->only(['environment', 'schema_version', 'legal_name', 'identification_number', 'is_active']),
        ]);

        return $haciendaSetting->fresh();
    }

    public function testConnection(Request $request, HaciendaSetting $haciendaSetting, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'hacienda.manage');

        $checks = [
            'configuracion_activa' => $haciendaSetting->is_active,
            'certificado' => (bool) $haciendaSetting->certificate_path && (
                Storage::disk('local')->exists($haciendaSetting->certificate_path) || file_exists($haciendaSetting->certificate_path)
            ),
            'pin_certificado' => (bool) $haciendaSetting->certificate_pin,
            'credenciales_atv' => (bool) $haciendaSetting->api_username && (bool) $haciendaSetting->api_password,
            'actividad_economica' => strlen((string) $haciendaSetting->economic_activity_code) === 6,
            'sucursal_terminal' => strlen((string) $haciendaSetting->branch_code) === 3 && strlen((string) $haciendaSetting->terminal_code) === 5,
        ];

        $tokenStatus = 'not_checked';
        if ($checks['credenciales_atv']) {
            $response = Http::asForm()
                ->acceptJson()
                ->timeout(10)
                ->post(config('services.hacienda.token_url'), [
                    'grant_type' => 'password',
                    'client_id' => $haciendaSetting->environment === 'production'
                        ? config('services.hacienda.production_client_id')
                        : config('services.hacienda.staging_client_id'),
                    'username' => $haciendaSetting->api_username,
                    'password' => $haciendaSetting->api_password,
                ]);

            $tokenStatus = $response->successful() ? 'ok' : 'failed';
        }

        $result = [
            'ok' => ! in_array(false, $checks, true) && $tokenStatus !== 'failed',
            'environment' => $haciendaSetting->environment,
            'checks' => $checks,
            'token_status' => $tokenStatus,
        ];

        $activityLogger->log($request->user(), 'hacienda_setting.connection_tested', $haciendaSetting, $result);

        return $result;
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['nullable', 'exists:branches,id'],
            'environment' => ['required', Rule::in(['staging', 'production'])],
            'schema_version' => ['nullable', Rule::in(['4.4'])],
            'legal_name' => ['required', 'string', 'max:100'],
            'commercial_name' => ['nullable', 'string', 'max:80'],
            'identification_type' => ['required', Rule::in(['01', '02', '03', '04'])],
            'identification_number' => ['required', 'string', 'max:12'],
            'economic_activity_code' => ['required', 'string', 'size:6'],
            'province' => ['required', 'string', 'size:1'],
            'canton' => ['required', 'string', 'size:2'],
            'district' => ['required', 'string', 'size:2'],
            'barrio' => ['nullable', 'string', 'size:2'],
            'other_signs' => ['required', 'string', 'max:250'],
            'country_code' => ['nullable', 'string', 'size:3'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:160'],
            'branch_code' => ['required', 'string', 'size:3'],
            'terminal_code' => ['required', 'string', 'size:5'],
            'certificate_path' => ['nullable', 'string', 'max:255'],
            'certificate_pin' => ['nullable', 'string', 'max:255'],
            'api_username' => ['nullable', 'string', 'max:180'],
            'api_password' => ['nullable', 'string', 'max:255'],
            'callback_url' => ['nullable', 'url', 'max:255'],
            'is_active' => ['boolean'],
        ]);
    }
}
