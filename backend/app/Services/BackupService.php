<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
            'tables' => $database ? count(json_decode($database, true) ?: []) : 0,
        ];
    }

    public function restore(string $backup): array
    {
        $path = $this->resolve($backup);
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            abort(422, 'El respaldo no se pudo abrir.');
        }

        $database = $zip->getFromName('database.json');
        $zip->close();

        if (! $database || ! json_validate($database)) {
            throw ValidationException::withMessages(['backup' => 'El respaldo no contiene una base de datos valida.']);
        }

        $dump = json_decode($database, true);
        if (! is_array($dump)) {
            throw ValidationException::withMessages(['backup' => 'El respaldo tiene un formato invalido.']);
        }

        $tables = $this->orderedTables(array_values(array_intersect($this->tableNames(), array_keys($dump))));
        Schema::disableForeignKeyConstraints();

        try {
            foreach (array_reverse($tables) as $table) {
                DB::table($table)->delete();
            }

            foreach ($tables as $table) {
                $rows = $dump[$table] ?? [];
                foreach (array_chunk($rows, 500) as $chunk) {
                    if ($chunk !== []) {
                        DB::table($table)->insert($chunk);
                    }
                }
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        return [
            'ok' => true,
            'name' => basename($path),
            'tables_restored' => count($tables),
        ];
    }

    public function prune(int $retentionDays): int
    {
        $threshold = now()->subDays($retentionDays)->timestamp;

        return collect(File::glob($this->directory() . DIRECTORY_SEPARATOR . '*.zip'))
            ->filter(fn (string $path) => File::lastModified($path) < $threshold)
            ->each(fn (string $path) => File::delete($path))
            ->count();
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

    private function orderedTables(array $tables): array
    {
        $tableSet = array_flip($tables);
        $dependencies = [];

        foreach ($tables as $table) {
            $dependencies[$table] = array_values(array_filter(
                $this->parentTables($table),
                fn (string $parent) => isset($tableSet[$parent]),
            ));
        }

        $ordered = [];
        $visiting = [];
        $visited = [];

        $visit = function (string $table) use (&$visit, &$ordered, &$visiting, &$visited, $dependencies): void {
            if (isset($visited[$table]) || isset($visiting[$table])) {
                return;
            }

            $visiting[$table] = true;
            foreach ($dependencies[$table] ?? [] as $parent) {
                $visit($parent);
            }
            unset($visiting[$table]);
            $visited[$table] = true;
            $ordered[] = $table;
        };

        foreach ($tables as $table) {
            $visit($table);
        }

        return $ordered;
    }

    private function parentTables(string $table): array
    {
        if (DB::getDriverName() === 'sqlite') {
            return collect(DB::select("PRAGMA foreign_key_list('{$table}')"))
                ->pluck('table')
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        if (DB::getDriverName() === 'mysql') {
            return collect(DB::select(
                'SELECT REFERENCED_TABLE_NAME as table_name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL',
                [DB::getDatabaseName(), $table],
            ))
                ->pluck('table_name')
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        return [];
    }
}
