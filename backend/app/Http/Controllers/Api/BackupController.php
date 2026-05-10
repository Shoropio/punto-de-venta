<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AccessControl;
use App\Services\ActivityLogger;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class BackupController extends Controller
{
    public function index()
    {
        $backups = collect(File::glob($this->backupDirectory() . DIRECTORY_SEPARATOR . '*.zip'))
            ->map(fn (string $path) => app(BackupService::class)->row($path))
            ->sortByDesc('created_at')
            ->values();

        return [
            'schedule' => Setting::where('group', 'backups')->get()->pluck('value', 'key'),
            'data' => $backups,
        ];
    }

    public function store(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger, BackupService $backupService)
    {
        $accessControl->authorize($request->user(), 'backups.manage');

        $row = $backupService->create();
        $activityLogger->log($request->user(), 'backup.created', null, $row);

        return response()->json($row, 201);
    }

    public function download(string $backup)
    {
        $path = app(BackupService::class)->resolve($backup);

        return response()->download($path);
    }

    public function verify(Request $request, string $backup, AccessControl $accessControl, BackupService $backupService)
    {
        $accessControl->authorize($request->user(), 'backups.manage');

        return $backupService->verify($backup);
    }

    public function schedule(Request $request, AccessControl $accessControl, ActivityLogger $activityLogger)
    {
        $accessControl->authorize($request->user(), 'backups.manage');

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
        $accessControl->authorize($request->user(), 'backups.manage');

        $backupService = app(BackupService::class);
        $path = $backupService->resolve($backup);
        $row = $backupService->row($path);
        File::delete($path);
        $activityLogger->log($request->user(), 'backup.deleted', null, $row);

        return response()->noContent();
    }

    private function backupDirectory(): string
    {
        return app(BackupService::class)->directory();
    }
}
