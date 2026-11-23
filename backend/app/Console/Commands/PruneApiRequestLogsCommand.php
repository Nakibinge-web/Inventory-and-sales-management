<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ApiRequestLog;
use App\Services\AuditLogService;

class PruneApiRequestLogsCommand extends Command
{
    protected $signature = 'telemetry:prune {--days= : The number of days of telemetry logs to retain}';

    protected $description = 'Prune old API request telemetry logs based on retention policy';

    public function handle(): int
    {
        $daysOption = $this->option('days');
        $days = $daysOption !== null ? (int) $daysOption : (int) config('telemetry.retention_days', 30);

        if ($days < 1) {
            $this->error('Retention days must be at least 1.');
            return self::FAILURE;
        }

        $cutoff = now()->subDays($days);
        $this->info("Pruning API request logs older than {$days} days (before {$cutoff->toDateTimeString()})...");

        $count = ApiRequestLog::where('created_at', '<', $cutoff)->delete();

        $this->info("Successfully deleted {$count} expired API request log records.");

        AuditLogService::log(
            'telemetry.pruned',
            "Pruned {$count} API request telemetry records older than {$days} days",
            [
                'severity'   => 'info',
                'properties' => [
                    'retention_days' => $days,
                    'records_pruned' => $count,
                    'cutoff_date'    => $cutoff->toIso8601String(),
                ],
            ]
        );

        return self::SUCCESS;
    }
}
