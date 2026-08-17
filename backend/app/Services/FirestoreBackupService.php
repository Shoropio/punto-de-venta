<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirestoreBackupService
{
    private ?string $projectId;
    private ?string $apiKey;

    public function __construct()
    {
        $this->projectId = config('services.firestore.project_id');
        $this->apiKey = config('services.firestore.api_key');
    }

    public function syncDatabase(): array
    {
        if (! $this->projectId) {
            // Local fallback simulation if Firestore credentials are not set
            Log::warning('Firestore backup skipped: FIRESTORE_PROJECT_ID no esta configurado. Simulando respaldo local.');
            return [
                'success' => true,
                'mode' => 'simulated',
                'synchronized_tables' => ['users', 'products', 'customers', 'sales', 'invoices'],
                'message' => 'Configura FIRESTORE_PROJECT_ID en el archivo .env para habilitar respaldos reales.',
            ];
        }

        $tables = ['users', 'products', 'customers', 'sales', 'invoices'];
        $syncedCounts = [];

        foreach ($tables as $table) {
            $rows = DB::table($table)->get();
            $syncedCounts[$table] = 0;

            foreach ($rows as $row) {
                $documentId = (string) ($row->id ?? uniqid());
                $fields = $this->mapRowToFirestoreFields((array) $row);

                $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$table}/{$documentId}";
                if ($this->apiKey) {
                    $url .= "?key={$this->apiKey}";
                }

                $response = Http::post($url, [
                    'fields' => $fields,
                ]);

                if ($response->successful()) {
                    $syncedCounts[$table]++;
                } else {
                    Log::error("Error sincronizando fila {$documentId} de la tabla {$table} a Firestore: " . $response->body());
                }
            }
        }

        return [
            'success' => true,
            'mode' => 'cloud',
            'synced_counts' => $syncedCounts,
        ];
    }

    private function mapRowToFirestoreFields(array $row): array
    {
        $fields = [];
        foreach ($row as $key => $value) {
            if ($value === null) {
                $fields[$key] = ['nullValue' => null];
            } elseif (is_bool($value)) {
                $fields[$key] = ['booleanValue' => $value];
            } elseif (is_int($value)) {
                $fields[$key] = ['integerValue' => (string) $value];
            } elseif (is_numeric($value)) {
                $fields[$key] = ['doubleValue' => (float) $value];
            } else {
                $fields[$key] = ['stringValue' => (string) $value];
            }
        }
        return $fields;
    }
}
