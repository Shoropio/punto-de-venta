<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use ZipArchive;

class BackupController extends Controller
{
    public function index()
    {
        $backups = collect(File::glob($this->backupDirectory() . DIRECTORY_SEPARATOR . '*.zip'))
            ->map(fn (string $path) => $this->backupRow($path))
            ->sortByDesc('created_at')
            ->values();

        return [
            'schedule' => Setting::where('group', 'backups')->get()->pluck('value', 'key'),
            'data' => $backups,
        ];
    }

    public function store(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

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

        $row = $this->backupRow($path);
        $activityLogger->log($request->user(), 'backup.created', null, $row);

        return response()->json($row, 201);
    }

    public function download(string $backup)
    {
        $path = $this->resolveBackup($backup);

        return response()->download($path);
    }

    public function verify(Request $request, string $backup, AccessControl $accessControl)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $path = $this->resolveBackup($backup);
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

    public function schedule(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'frequency' => ['required', 'in:daily,weekly'],
            'time' => ['required', 'date_format:H:i'],
            'retention' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['branch_id' => null, 'key' => "backup_{$key}"],
                ['group' => 'backups', 'value' => $value],
            );
        }

        $activityLogger->log($request->user(), 'backup.schedule_updated', null, $data);

        return ['ok' => true, 'schedule' => $data];
    }

    public function destroy(Request $request, string $backup, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'settings.manage');

        $path = $this->resolveBackup($backup);
        $row = $this->backupRow($path);
        File::delete($path);
        $activityLogger->log($request->user(), 'backup.deleted', null, $row);

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
