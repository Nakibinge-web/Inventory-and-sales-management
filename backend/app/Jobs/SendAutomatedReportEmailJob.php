<?php

namespace App\Jobs;

use App\Mail\AutomatedReportMailable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendAutomatedReportEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public string $recipientEmail;
    public array $reportData;
    public string $reportType;
    public string $periodStart;
    public string $periodEnd;

    public function __construct(
        string $recipientEmail,
        array $reportData,
        string $reportType,
        string $periodStart,
        string $periodEnd
    ) {
        $this->recipientEmail = $recipientEmail;
        $this->reportData = $reportData;
        $this->reportType = $reportType;
        $this->periodStart = $periodStart;
        $this->periodEnd = $periodEnd;
    }

    public function handle(): void
    {
        try {
            Mail::to($this->recipientEmail)->send(new AutomatedReportMailable(
                $this->reportData,
                $this->reportType,
                $this->periodStart,
                $this->periodEnd
            ));
        } catch (\Throwable $e) {
            Log::warning("Could not send automated report email: " . $e->getMessage());
            throw $e;
        }
    }
}
