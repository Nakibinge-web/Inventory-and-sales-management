<?php

namespace App\Jobs;

use App\Models\ReportPreference;
use App\Services\ReportService;
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

    public function __construct($preferenceId)
    {
        $this->preferenceId = $preferenceId;
    }

    public function handle(ReportService $reportService, \App\Services\ReportDeliveryService $deliveryService)
    {
        $preference = ReportPreference::find($this->preferenceId);

        if (!$preference || !$preference->is_enabled) {
            return;
        }

        // Establish tenant context.
        app()->instance('current_tenant', $preference->tenant);

        try {
            $period = $this->getPeriod($preference);
            $data = $this->generateReportData($preference, $reportService);

            $deliveryService->deliver(
                $preference,
                $data,
                $period['start'],
                $period['end']
            );

            Log::info("Successfully generated and delivered automated report", [
                'tenant_id' => $preference->tenant_id,
                'report_type' => $preference->report_type,
            ]);

            $preference->update(['last_sent_at' => now()]);
        } catch (\Exception $e) {
            Log::error("Failed to generate/deliver automated report", [
                'tenant_id' => $preference->tenant_id,
                'report_type' => $preference->report_type,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        } finally {
            // Ensure tenant context is cleared to prevent leakage
            app()->forgetInstance('current_tenant');
        }
    }

    private function getPeriod(ReportPreference $preference): array
    {
        $now = Carbon::now();
        return match ($preference->report_type) {
            'daily_sales', 'daily_purchases' => [
                'start' => $now->copy()->subDay()->toDateString(),
                'end' => $now->copy()->subDay()->toDateString()
            ],
            'weekly_sales' => [
                'start' => $now->copy()->subWeek()->startOfWeek()->toDateString(),
                'end' => $now->copy()->subWeek()->endOfWeek()->toDateString()
            ],
            'monthly_sales', 'monthly_purchases' => [
                'start' => $now->copy()->subMonth()->startOfMonth()->toDateString(),
                'end' => $now->copy()->subMonth()->endOfMonth()->toDateString()
            ],
            default => ['start' => 'N/A', 'end' => 'N/A']
        };
    }

    private function generateReportData(ReportPreference $preference, ReportService $reportService)
    {
        $now = Carbon::now();

        return match ($preference->report_type) {
            'daily_sales' => $reportService->getDailySalesReport($now->subDay()->toDateString()),
            'weekly_sales' => $reportService->getWeeklySalesReport($now->subWeek()->toDateString()),
            'monthly_sales' => $reportService->getMonthlySalesReport($now->subMonth()->format('Y-m')),
            'daily_purchases' => $reportService->getDailyPurchasesReport($now->subDay()->toDateString()),
            'monthly_purchases' => $reportService->getMonthlyPurchasesReport($now->subMonth()->format('Y-m')),
            default => throw new \Exception("Unsupported report type: {$preference->report_type}"),
        };
    }
}
