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
    protected $description = 'Generate reports based on tenant preferences and scheduling rules';

    public function handle()
    {
        $this->info('Checking for due automated reports...');
        
        $preferences = ReportPreference::where('is_enabled', true)->get();

        $dispatched = 0;
        foreach ($preferences as $preference) {
            if ($this->isDue($preference)) {
                $this->info("Dispatching report for Tenant ID: {$preference->tenant_id}, Type: {$preference->report_type}, Frequency: {$preference->frequency}");
                GenerateAutomatedReportJob::dispatch($preference->id);
                $dispatched++;
            }
        }

        $this->info("Finished checking automated reports. Dispatched: {$dispatched}");
    }

    public function isDue(ReportPreference $preference): bool
    {
        $now = Carbon::now();

        // If next_run_at is explicitly set, check if reached
        if ($preference->next_run_at) {
            return $now->gte(Carbon::parse($preference->next_run_at));
        }

        if (!$preference->last_sent_at) {
            // Never generated: check if time criteria (if set) is met
            return $this->matchesTimeCriteria($preference, $now);
        }

        $lastSent = Carbon::parse($preference->last_sent_at);

        // Sub-day intervals (minutes or hourly)
        $minuteIntervals = [
            'every_5_minutes'  => 5,
            'every_10_minutes' => 10,
            'every_15_minutes' => 15,
            'every_30_minutes' => 30,
            'hourly'           => 60,
            'every_2_hours'    => 120,
            'every_6_hours'    => 360,
        ];

        if (isset($minuteIntervals[$preference->frequency])) {
            $requiredMins = $minuteIntervals[$preference->frequency];
            return $lastSent->diffInMinutes($now) >= $requiredMins;
        }

        if ($preference->frequency === 'custom_minutes' && $preference->interval_minutes > 0) {
            return $lastSent->diffInMinutes($now) >= $preference->interval_minutes;
        }

        switch ($preference->frequency) {
            case 'daily':
                if (!empty($preference->time_of_day)) {
                    $scheduledToday = Carbon::parse($now->toDateString() . ' ' . $preference->time_of_day);
                    return $now->gte($scheduledToday) && $lastSent->isBefore($scheduledToday);
                }
                return $lastSent->isBefore($now->startOfDay());

            case 'weekly':
                $dayOfWeek = strtolower($preference->day_of_week ?? 'monday');
                $isTargetDay = strtolower($now->format('l')) === $dayOfWeek;
                if (!empty($preference->time_of_day)) {
                    $scheduledToday = Carbon::parse($now->toDateString() . ' ' . $preference->time_of_day);
                    return $isTargetDay && $now->gte($scheduledToday) && $lastSent->isBefore($scheduledToday);
                }
                return $isTargetDay && $lastSent->isBefore($now->startOfDay());

            case 'monthly':
                $targetDay = (int) ($preference->day_of_month ?? 1);
                $isTargetDay = (int) $now->format('j') === $targetDay;
                if (!empty($preference->time_of_day)) {
                    $scheduledToday = Carbon::parse($now->toDateString() . ' ' . $preference->time_of_day);
                    return $isTargetDay && $now->gte($scheduledToday) && $lastSent->isBefore($scheduledToday);
                }
                return $isTargetDay && $lastSent->isBefore($now->startOfDay());

            default:
                return false;
        }
    }

    private function matchesTimeCriteria(ReportPreference $preference, Carbon $now): bool
    {
        if (in_array($preference->frequency, [
            'every_5_minutes', 'every_10_minutes', 'every_15_minutes', 'every_30_minutes',
            'hourly', 'every_2_hours', 'every_6_hours', 'custom_minutes'
        ])) {
            return true;
        }

        if (!empty($preference->time_of_day)) {
            $scheduledToday = Carbon::parse($now->toDateString() . ' ' . $preference->time_of_day);
            if ($now->lt($scheduledToday)) {
                return false; // Not yet time today
            }
        }

        if ($preference->frequency === 'weekly' && !empty($preference->day_of_week)) {
            if (strtolower($now->format('l')) !== strtolower($preference->day_of_week)) {
                return false;
            }
        }

        if ($preference->frequency === 'monthly' && !empty($preference->day_of_month)) {
            if ((int)$now->format('j') !== (int)$preference->day_of_month) {
                return false;
            }
        }

        return true;
    }
}
