<?php

namespace App\Services;

use App\Models\GeneratedReport;
use App\Models\ReportPreference;
use App\Mail\AutomatedReportMailable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class ReportDeliveryService
{
    /**
     * Deliver and save a generated report based on the preference.
     * Always saves to the database for previewing from the reports module.
     */
    public function deliver(
        ReportPreference $preference,
        array $reportData,
        string $periodStart,
        string $periodEnd,
        string $source = 'automated'
    ): GeneratedReport {
        // Human-friendly title
        $typeNames = [
            'daily_sales'       => 'Daily Sales Report',
            'weekly_sales'      => 'Weekly Sales Report',
            'monthly_sales'     => 'Monthly Sales Report',
            'yearly_sales'      => 'Yearly Sales Report',
            'daily_purchases'   => 'Daily Purchases Report',
            'monthly_purchases' => 'Monthly Purchases Report',
        ];
        $typeName = $typeNames[$preference->report_type] ?? ucwords(str_replace('_', ' ', $preference->report_type));
        $title = "{$typeName} ({$periodStart})";

        // Always save to database
        $report = GeneratedReport::create([
            'tenant_id'          => $preference->tenant_id,
            'report_type'        => $preference->report_type,
            'title'              => $title,
            'period_start'       => $periodStart !== 'N/A' ? $periodStart : null,
            'period_end'         => $periodEnd !== 'N/A' ? $periodEnd : null,
            'total_sales'        => floatval($reportData['total_sales'] ?? 0),
            'total_profit'       => floatval($reportData['total_profit'] ?? 0),
            'total_transactions' => intval($reportData['total_transactions'] ?? count($reportData['sales'] ?? [])),
            'source'             => $source,
            'generated_at'       => now(),
            'data'               => $reportData,
        ]);

        // If email delivery requested and recipient email set
        if (in_array($preference->delivery_method, ['email', 'both']) && !empty($preference->recipient_email)) {
            try {
                Mail::to($preference->recipient_email)->send(new AutomatedReportMailable(
                    $reportData,
                    $preference->report_type,
                    $periodStart,
                    $periodEnd
                ));
            } catch (\Exception $e) {
                Log::warning("Could not send automated report email: " . $e->getMessage());
            }
        }

        return $report;
    }
}
