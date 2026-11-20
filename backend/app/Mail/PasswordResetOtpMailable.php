<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMailable extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $userName;
    public string $tenantName;
    public int $expiresInMinutes;

    public function __construct(string $otp, string $userName, string $tenantName, int $expiresInMinutes = 10)
    {
        $this->otp = $otp;
        $this->userName = $userName;
        $this->tenantName = $tenantName;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    public function build()
    {
        return $this->subject("StockPro Password Reset OTP — {$this->tenantName}")
                    ->view('emails.password-reset-otp');
    }
}
