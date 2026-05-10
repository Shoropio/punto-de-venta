<?php

use Illuminate\Foundation\Inspiring;
use App\Models\Setting;
use App\Services\BackupService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('backups:run-scheduled', function (BackupService $backupService) {
    $settings = Setting::where('group', 'backups')->get()->pluck('value', 'key');

    if (! filter_var($settings->get('backup_enabled', false), FILTER_VALIDATE_BOOLEAN)) {
        $this->info('Backups programados desactivados.');
        return self::SUCCESS;
    }

    $frequency = $settings->get('backup_frequency', 'daily');
    $scheduledTime = $settings->get('backup_time', '02:00');
    $lastRun = $settings->get('backup_last_run');
    $now = now();

    if ($now->format('H:i') < $scheduledTime) {
        $this->info('Aun no es la hora programada.');
        return self::SUCCESS;
    }

    if ($lastRun) {
        $last = Carbon::parse($lastRun);
        $alreadyRan = $frequency === 'weekly'
            ? $last->isSameWeek($now)
            : $last->isSameDay($now);

        if ($alreadyRan) {
            $this->info('El respaldo programado ya se ejecuto en este periodo.');
            return self::SUCCESS;
        }
    }

    $row = $backupService->create();
    Setting::updateOrCreate(['branch_id' => null, 'key' => 'backup_last_run'], ['group' => 'backups', 'value' => $now->toIso8601String()]);

    $retention = (int) $settings->get('backup_retention', 30);
    collect(glob($backupService->directory() . DIRECTORY_SEPARATOR . '*.zip'))
        ->filter(fn ($path) => filemtime($path) < $now->copy()->subDays($retention)->timestamp)
        ->each(fn ($path) => @unlink($path));

    $this->info('Respaldo programado creado: ' . $row['name']);
    return self::SUCCESS;
})->purpose('Ejecuta el respaldo programado si corresponde.');
