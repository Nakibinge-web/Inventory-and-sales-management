<?php

namespace App\Console\Commands;

use App\Models\ReportPreference;
use App\Jobs\GenerateAutomatedReportJob;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GenerateAutomatedReports extends Command
{
    protected $signature = 'reports:generate-automated';
    protected $description = 'Generate reports based on tenant preferences';

    public function handle()
    {
        $this->info('Checking for due automated reports...');
        
        $preferences = ReportPreference::where('is_enabled', true)->get();

        foreach ($preferences as $preference) {
            if ($this->isDue($preference)) {
                $this->info("Dispatching job for Tenant ID: {$preference->tenant_id}, Type: {$preference->report_type}");
                GenerateAutomatedReportJob::dispatch($preference->id);
            }
        }

        $this->info('Finished checking automated reports.');
    }

    private function isDue(ReportPreference $preference): bool
    {
        if (!$preference->last_sent_at) {
            return true; // Never generated
        }

        $lastSent = Carbon::parse($preference->last_sent_at);
        $now = Carbon::now();

        switch ($preference->frequency) {
            case 'daily':
                return $lastSent->isBefore($now->startOfDay());
            case 'weekly':
                // Check if last sent was before the start of the current week (assuming Monday start)
                return $lastSent->isBefore($now->startOfWeek());
            case 'monthly':
                // Check if last sent was before the start of the current month
                return $lastSent->isBefore($now->startOfMonth());
            default:
                return false;
        }
    }
}
