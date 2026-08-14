<?php

namespace App\Services;

use App\Models\GeneratedReport;
use App\Models\ReportPreference;
use App\Mail\AutomatedReportMailable;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Exception;

class ReportDeliveryService
{
    /**
     * Deliver a generated report based on the preference.
     */
    public function deliver(
        ReportPreference $preference,
        array $reportData,
        string $periodStart,
        string $periodEnd
    ): void {
        match ($preference->delivery_method) {
            'email' => $this->deliverViaEmail($preference, $reportData, $periodStart, $periodEnd),
            'dashboard' => $this->deliverViaDashboard($preference, $reportData),
            default => throw new Exception("Unsupported delivery method: {$preference->delivery_method}"),
        };
    }

    private function deliverViaEmail(
        ReportPreference $preference,
        array $reportData,
        string $periodStart,
        string $periodEnd
    ): void {
        if (!$preference->recipient_email) {
            throw new Exception("Recipient email is missing for report: {$preference->report_type}");
        }

        Mail::to($preference->recipient_email)->send(new AutomatedReportMailable(
            $reportData,
            $preference->report_type,
            $periodStart,
            $periodEnd
        ));
    }

    private function deliverViaDashboard(ReportPreference $preference, array $reportData): void
    {
        GeneratedReport::create([
            'tenant_id'    => $preference->tenant_id,
            'report_type'  => $preference->report_type,
            'generated_at' => now(),
            'data'         => $reportData,
        ]);
    }
}
