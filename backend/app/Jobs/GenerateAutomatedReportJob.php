<?php

namespace App\Jobs;

use App\Models\ReportPreference;
use App\Services\ReportService;
use App\Services\ReportDeliveryService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateAutomatedReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $preferenceId;
    protected $source;
    protected bool $queueEmail;

    public function __construct($preferenceId, string $source = 'automated', bool $queueEmail = false)
    {
        $this->preferenceId = $preferenceId;
        $this->source = $source;
        $this->queueEmail = $queueEmail;
    }

    public function handle(ReportService $reportService, ReportDeliveryService $deliveryService)
    {
        $preference = ReportPreference::find($this->preferenceId);

        if (!$preference || (!$preference->is_enabled && $this->source === 'automated')) {
            return null;
        }

        if ($preference->tenant && $preference->tenant->isSubscriptionExpired()) {
            return null;
        }

        // Establish tenant context
        app()->instance('current_tenant', $preference->tenant);

        try {
            $period = $this->getPeriod($preference);
            $data = $this->generateReportData($preference, $reportService, $period);

            $savedReport = $deliveryService->deliver(
                $preference,
                $data,
                $period['start'],
                $period['end'],
                $this->source,
                $this->queueEmail
            );

            Log::info("Successfully generated and saved automated report #{$savedReport->id}", [
                'tenant_id'   => $preference->tenant_id,
                'report_type' => $preference->report_type,
            ]);

            if ($this->source === 'automated') {
                $updates = [
                    'last_sent_at' => now(),
                    'next_run_at'  => $preference->computeNextRunAfterExecution(),
                ];
                if ($preference->frequency === 'scheduled_once') {
                    $updates['is_enabled'] = false;
                }
                $preference->update($updates);
            } else {
                $updates = ['last_sent_at' => now()];
                if ($preference->is_enabled && $preference->isLoopSchedule()) {
                    $updates['next_run_at'] = Carbon::now()->addMinutes($preference->resolveLoopMinutes());
                }
                $preference->update($updates);
            }

            return $savedReport;
        } catch (\Exception $e) {
            Log::error("Failed to generate/deliver automated report", [
                'tenant_id'   => $preference->tenant_id,
                'report_type' => $preference->report_type,
                'error'       => $e->getMessage(),
            ]);
            throw $e;
        } finally {
            app()->forgetInstance('current_tenant');
        }
    }

    private function getPeriod(ReportPreference $preference): array
    {
        $now = Carbon::now();

        return match ($preference->report_type) {
            'daily_sales', 'daily_purchases' => [
                'start' => $now->toDateString(),
                'end'   => $now->toDateString(),
            ],
            'weekly_sales' => [
                'start' => $now->copy()->startOfWeek()->toDateString(),
                'end'   => $now->copy()->endOfWeek()->toDateString(),
            ],
            'monthly_sales', 'monthly_purchases' => [
                'start' => $now->copy()->startOfMonth()->toDateString(),
                'end'   => $now->copy()->endOfMonth()->toDateString(),
            ],
            'yearly_sales' => [
                'start' => $now->copy()->startOfYear()->toDateString(),
                'end'   => $now->copy()->endOfYear()->toDateString(),
            ],
            default => [
                'start' => $now->toDateString(),
                'end'   => $now->toDateString(),
            ],
        };
    }

    private function generateReportData(ReportPreference $preference, ReportService $reportService, array $period): array
    {
        return match ($preference->report_type) {
            'daily_sales'       => $reportService->getDailySalesReport($period['start']),
            'weekly_sales'      => $reportService->getWeeklySalesReport($period['start']),
            'monthly_sales'     => $reportService->getMonthlySalesReport(Carbon::parse($period['start'])->format('Y-m')),
            'yearly_sales'      => $reportService->getYearlySalesReport((int) Carbon::parse($period['start'])->format('Y')),
            'daily_purchases'   => $reportService->getDailyPurchasesReport($period['start']),
            'monthly_purchases' => $reportService->getMonthlyPurchasesReport(Carbon::parse($period['start'])->format('Y-m')),
            default => throw new \Exception("Unsupported report type: {$preference->report_type}"),
        };
    }
}
