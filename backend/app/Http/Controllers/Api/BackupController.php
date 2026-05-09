<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use ZipArchive;

class BackupController extends Controller
{
    public function index()
    {
        return collect(File::glob($this->backupDirectory() . DIRECTORY_SEPARATOR . '*.zip'))
            ->map(fn (string $path) => $this->backupRow($path))
            ->sortByDesc('created_at')
            ->values();
    }

    public function store(Request $request)
    {
        File::ensureDirectoryExists($this->backupDirectory());

        $filename = 'backup-' . now()->format('Ymd-His') . '-' . Str::lower(Str::random(4)) . '.zip';
        $path = $this->backupDirectory() . DIRECTORY_SEPARATOR . $filename;

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

        return response()->json($this->backupRow($path), 201);
    }

    public function download(string $backup)
    {
        $path = $this->resolveBackup($backup);

        return response()->download($path);
    }

    public function destroy(string $backup)
    {
        File::delete($this->resolveBackup($backup));

        return response()->noContent();
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
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
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

    private function backupRow(string $path): array
    {
        return [
            'name' => basename($path),
            'size' => File::size($path),
            'created_at' => date(DATE_ATOM, File::lastModified($path)),
        ];
    }

    private function resolveBackup(string $backup): string
    {
        $path = $this->backupDirectory() . DIRECTORY_SEPARATOR . basename($backup);

        abort_unless(File::exists($path), 404, 'Respaldo no encontrado.');

        return $path;
    }

    private function backupDirectory(): string
    {
        return storage_path('app/backups');
    }
}
