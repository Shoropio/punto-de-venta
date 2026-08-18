<?php

namespace App\Services\Cloud;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirestoreBackupService
{
    private string $projectId;
    private string $serviceAccountKey;

    public function __construct()
    {
        $this->projectId = config('services.firestore.project_id', '');
        $this->serviceAccountKey = config('services.firestore.service_account_key', '');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->projectId) && ! empty($this->serviceAccountKey);
    }

    public function getAccessToken(): ?string
    {
        try {
            $key = json_decode($this->serviceAccountKey, true);

            if (! $key || ! isset($key['client_email'], $key['private_key'])) {
                return null;
            }

            $now = time();
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode([
                'iss' => $key['client_email'],
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ]));

            $signatureInput = "{$header}.{$payload}";
            openssl_sign($signatureInput, $signature, $key['private_key'], 'SHA256');
            $jwt = "{$header}.{$payload}.".base64_encode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->failed()) {
                Log::error('Firestore: Failed to obtain access token', ['status' => $response->status()]);
                return null;
            }

            return $response->json('access_token');
        } catch (\Throwable $e) {
            Log::error('Firestore: Token generation failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    public function syncDatabase(): array
    {
        if (! $this->isConfigured()) {
            Log::warning('Firestore backup skipped: service account no esta configurado.');
            return [
                'success' => true,
                'mode' => 'simulated',
                'synchronized_tables' => ['users', 'products', 'customers', 'sales', 'invoices'],
                'message' => 'Configura FIRESTORE_SERVICE_ACCOUNT_KEY en .env para respaldos reales.',
            ];
        }

        $token = $this->getAccessToken();
        if (! $token) {
            return ['success' => false, 'error' => 'No se pudo obtener token de acceso a Firestore.'];
        }

        $tables = ['users', 'products', 'customers', 'sales', 'invoices'];
        $syncedCounts = [];

        foreach ($tables as $table) {
            $rows = DB::table($table)->get();
            $syncedCounts[$table] = 0;

            foreach ($rows as $row) {
                $documentId = (string) ($row->id ?? uniqid());
                $fields = $this->mapRowToFirestoreFields((array) $row);

                try {
                    $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$table}/{$documentId}";

                    $response = Http::withToken($token)
                        ->patch($url, ['fields' => $fields]);

                    if ($response->successful()) {
                        $syncedCounts[$table]++;
                    } else {
                        Log::error("Firestore sync error: {$table}/{$documentId}", ['status' => $response->status()]);
                    }
                } catch (\Throwable $e) {
                    Log::error("Firestore sync exception: {$table}/{$documentId}", ['error' => $e->getMessage()]);
                }
            }
        }

        return [
            'success' => true,
            'mode' => 'cloud',
            'synced_counts' => $syncedCounts,
            'records' => array_sum($syncedCounts),
        ];
    }

    public function uploadBackup(string $localPath, string $storagePath): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('Firestore: Service not configured');
            return false;
        }

        $token = $this->getAccessToken();
        if (! $token) {
            return false;
        }

        try {
            $fileContent = file_get_contents($localPath);
            $bucketName = "{$this->projectId}.appspot.com";
            $url = "https://storage.googleapis.com/upload/storage/v1/b/{$bucketName}/o?uploadType=media&name={$storagePath}";

            $response = Http::withToken($token)
                ->withHeaders(['Content-Type' => 'application/zip'])
                ->withBody($fileContent, 'application/zip')
                ->post($url);

            if ($response->successful()) {
                Log::info('Firestore: Backup uploaded successfully', ['path' => $storagePath]);
                return true;
            }

            Log::error('Firestore: Upload failed', ['status' => $response->status(), 'body' => $response->body()]);
            return false;
        } catch (\Throwable $e) {
            Log::error('Firestore: Upload error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function listBackups(): array
    {
        if (! $this->isConfigured()) {
            return [];
        }

        $token = $this->getAccessToken();
        if (! $token) {
            return [];
        }

        try {
            $bucketName = "{$this->projectId}.appspot.com";
            $response = Http::withToken($token)
                ->get("https://storage.googleapis.com/storage/v1/b/{$bucketName}/o?prefix=backups/&maxResults=50");

            if ($response->failed()) {
                return [];
            }

            $items = $response->json('items', []);
            return array_map(fn ($item) => [
                'name' => basename($item['name']),
                'path' => $item['name'],
                'size' => $item['size'] ?? 0,
                'updated' => $item['updated'] ?? null,
            ], $items);
        } catch (\Throwable $e) {
            Log::error('Firestore: List backups error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    public function saveMetadata(array $metadata): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        $token = $this->getAccessToken();
        if (! $token) {
            return false;
        }

        try {
            $documentId = $metadata['id'] ?? uniqid('backup_');
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/backups/{$documentId}";

            $fields = [];
            foreach ($metadata as $key => $value) {
                if (is_string($value)) {
                    $fields[$key] = ['stringValue' => $value];
                } elseif (is_int($value)) {
                    $fields[$key] = ['integerValue' => (string) $value];
                } elseif (is_float($value)) {
                    $fields[$key] = ['doubleValue' => $value];
                } elseif (is_bool($value)) {
                    $fields[$key] = ['booleanValue' => $value];
                }
            }

            $response = Http::withToken($token)
                ->patch($url, ['fields' => $fields]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('Firestore: Save metadata error', ['error' => $e->getMessage()]);
            return false;
        }
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
