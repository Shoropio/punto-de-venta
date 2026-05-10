<?php

use Illuminate\Foundation\Inspiring;
use App\Models\Setting;
use App\Services\BackupService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Symfony\Component\Console\Command\Command;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('backups:run-scheduled', function (BackupService $backupService) {
    $settings = Setting::where('group', 'backups')->get()->pluck('value', 'key');

    if (! filter_var($settings->get('backup_enabled', false), FILTER_VALIDATE_BOOLEAN)) {
        $this->info('Backups programados desactivados.');
        return Command::SUCCESS;
    }

    $frequency = $settings->get('backup_frequency', 'daily');
    $scheduledTime = $settings->get('backup_time', '02:00');
    $lastRun = $settings->get('backup_last_run');
    $now = now();

    if ($now->format('H:i') < $scheduledTime) {
        $this->info('Aun no es la hora programada.');
        return Command::SUCCESS;
    }

    if ($lastRun) {
        $last = Carbon::parse($lastRun);
        $alreadyRan = $frequency === 'weekly'
            ? $last->isSameWeek($now)
            : $last->isSameDay($now);

        if ($alreadyRan) {
            $this->info('El respaldo programado ya se ejecuto en este periodo.');
            return Command::SUCCESS;
        }
    }

    $row = $backupService->create();
    Setting::updateOrCreate(['branch_id' => null, 'key' => 'backup_last_run'], ['group' => 'backups', 'value' => $now->toIso8601String()]);

    $deleted = $backupService->prune((int) $settings->get('backup_retention', 30));

    $this->info('Respaldo programado creado: ' . $row['name']);
    $this->info("Respaldos vencidos eliminados: {$deleted}");
    return Command::SUCCESS;
})->purpose('Ejecuta el respaldo programado si corresponde.');

Schedule::command('backups:run-scheduled')->everyMinute();
