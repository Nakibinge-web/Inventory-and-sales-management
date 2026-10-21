<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AutomatedReportMailable extends Mailable
{
    use Queueable, SerializesModels;

    public $reportData;
    public $reportType;
    public $periodStart;
    public $periodEnd;

    public function __construct(array $reportData, string $reportType, string $periodStart, string $periodEnd)
    {
        $this->reportData = $reportData;
        $this->reportType = $reportType;
        $this->periodStart = $periodStart;
        $this->periodEnd = $periodEnd;
    }

    public function build()
    {
        return $this->subject('Automated Report: ' . str_replace('_', ' ', ucfirst($this->reportType)))
                    ->view('emails.automated-report');
    }
}
