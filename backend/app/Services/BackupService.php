<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use ZipArchive;

class BackupService
{
    public function create(): array
    {
        File::ensureDirectoryExists($this->directory());

        $filename = 'backup-' . now()->format('Ymd-His') . '-' . Str::lower(Str::random(4)) . '.zip';
        $path = $this->directory() . DIRECTORY_SEPARATOR . $filename;

        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::CREATE) !== true) {
            abort(500, 'No fue posible crear el archivo de respaldo.');
        }

        $zip->addFromString('manifest.json', json_encode([
            'created_at' => now()->toIso8601String(),
            'database' => config('database.default'),
            'app' => config('app.name'),
        ], JSON_PRETTY_PRINT));

        $zip->addFromString('database.json', json_encode($this->databaseDump(), JSON_PRETTY_PRINT));
        $zip->close();

        return $this->row($path);
    }

    public function verify(string $backup): array
    {
        $path = $this->resolve($backup);
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            abort(422, 'El respaldo no se pudo abrir.');
        }

        $manifest = $zip->getFromName('manifest.json');
        $database = $zip->getFromName('database.json');
        $zip->close();

        return [
            'ok' => (bool) $manifest && (bool) $database && json_validate($manifest) && json_validate($database),
            'manifest' => $manifest ? json_decode($manifest, true) : null,
            'has_database' => (bool) $database,
        ];
    }

    public function row(string $path): array
    {
        return [
            'name' => basename($path),
            'size' => File::size($path),
            'created_at' => date(DATE_ATOM, File::lastModified($path)),
        ];
    }

    public function resolve(string $backup): string
    {
        $path = $this->directory() . DIRECTORY_SEPARATOR . basename($backup);

        abort_unless(File::exists($path), 404, 'Respaldo no encontrado.');

        return $path;
    }

    public function directory(): string
    {
        return storage_path('app/backups');
    }

    private function databaseDump(): array
    {
        $dump = [];
        foreach ($this->tableNames() as $table) {
            $dump[$table] = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
        }

        return $dump;
    }

    private function tableNames(): array
    {
        if (DB::getDriverName() === 'sqlite') {
            return collect(DB::select("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'"))
                ->pluck('name')
                ->all();
        }

        $database = DB::getDatabaseName();

        return collect(DB::select('SHOW TABLES'))
            ->map(fn ($row) => (array) $row)
            ->map(fn ($row) => $row["Tables_in_{$database}"] ?? reset($row))
            ->filter()
            ->values()
            ->all();
    }
}
