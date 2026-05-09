<?php

namespace App\Services\Hacienda;

use App\Models\HaciendaSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HaciendaDocumentNumberService
{
    private const SEQUENCE_COLUMNS = [
        '01' => 'invoice_sequence',
        '02' => 'debit_note_sequence',
        '03' => 'credit_note_sequence',
        '04' => 'ticket_sequence',
        '08' => 'purchase_invoice_sequence',
        '09' => 'export_invoice_sequence',
        '10' => 'payment_receipt_sequence',
    ];

    public function next(int $branchId, string $documentType, ?string $environment = null): array
    {
        return DB::transaction(function () use ($branchId, $documentType, $environment): array {
            $setting = HaciendaSetting::query()
                ->where(function ($query) use ($branchId) {
                    $query->where('branch_id', $branchId)->orWhereNull('branch_id');
                })
                ->where('environment', $environment ?? config('services.hacienda.environment', 'staging'))
                ->where('is_active', true)
                ->orderByRaw('branch_id is null')
                ->lockForUpdate()
                ->first();

            if (! $setting) {
                throw ValidationException::withMessages([
                    'hacienda' => 'Configura Hacienda Costa Rica v4.4 antes de emitir comprobantes.',
                ]);
            }

            $sequenceColumn = self::SEQUENCE_COLUMNS[$documentType] ?? null;

            if (! $sequenceColumn) {
                throw ValidationException::withMessages([
                    'document_type' => 'Tipo de comprobante Hacienda no soportado.',
                ]);
            }

            $sequence = (int) $setting->{$sequenceColumn} + 1;
            $setting->forceFill([$sequenceColumn => $sequence])->save();

            $consecutive = $this->buildConsecutive($setting, $documentType, $sequence);
            $securityCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);

            return [
                'clave' => $this->buildClave($setting, $consecutive, $securityCode),
                'numero_consecutivo' => $consecutive,
                'security_code' => $securityCode,
                'schema_version' => $setting->schema_version,
            ];
        });
    }

    private function buildConsecutive(HaciendaSetting $setting, string $documentType, int $sequence): string
    {
        return str_pad($setting->branch_code, 3, '0', STR_PAD_LEFT)
            . str_pad($setting->terminal_code, 5, '0', STR_PAD_LEFT)
            . $documentType
            . str_pad((string) $sequence, 10, '0', STR_PAD_LEFT);
    }

    private function buildClave(HaciendaSetting $setting, string $consecutive, string $securityCode): string
    {
        $date = now('America/Costa_Rica')->format('dmy');
        $issuerId = str_pad(preg_replace('/\D+/', '', $setting->identification_number), 12, '0', STR_PAD_LEFT);
        $situation = $setting->environment === 'production' ? '1' : '1';

        return $setting->country_code . $date . $issuerId . $consecutive . $situation . $securityCode;
    }
}
