<?php

namespace App\Jobs;

use App\Mail\PasswordResetOtpMailable;
use App\Models\PasswordResetOtp;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendPasswordResetOtpJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $tenantId;
    public int $userId;
    public string $email;
    public string $otp;
    public string $userName;
    public string $tenantName;
    public int $expiresInMinutes;
    public ?int $otpRecordId;

    public function __construct(
        int $tenantId,
        int $userId,
        string $email,
        string $otp,
        string $userName,
        string $tenantName,
        int $expiresInMinutes = 10,
        ?int $otpRecordId = null
    ) {
        $this->tenantId = $tenantId;
        $this->userId = $userId;
        $this->email = strtolower(trim($email));
        $this->otp = $otp;
        $this->userName = $userName;
        $this->tenantName = $tenantName;
        $this->expiresInMinutes = $expiresInMinutes;
        $this->otpRecordId = $otpRecordId;
    }

    public function handle(): void
    {
        // Ensure the tenant-scoped OTP record is persisted in password_reset_otps
        $otpRecord = null;
        if ($this->otpRecordId) {
            $otpRecord = PasswordResetOtp::where('id', $this->otpRecordId)
                ->where('tenant_id', $this->tenantId)
                ->where('user_id', $this->userId)
                ->first();
        }

        if (!$otpRecord) {
            $otpRecord = PasswordResetOtp::where('tenant_id', $this->tenantId)
                ->where('user_id', $this->userId)
                ->where('email', $this->email)
                ->whereNull('used_at')
                ->latest('id')
                ->first();
        }

        if (!$otpRecord) {
            $otpRecord = PasswordResetOtp::create([
                'tenant_id'  => $this->tenantId,
                'user_id'    => $this->userId,
                'email'      => $this->email,
                'otp_hash'   => PasswordResetOtp::hashForTenant($this->tenantId, $this->userId, $this->otp),
                'attempts'   => 0,
                'expires_at' => now()->addMinutes($this->expiresInMinutes),
            ]);
        } else {
            $otpRecord->touch();
        }

        Mail::to($this->email)->send(new PasswordResetOtpMailable(
            $this->otp,
            $this->userName,
            $this->tenantName,
            $this->expiresInMinutes
        ));

        Log::info("Queued password reset OTP email sent and saved in password_reset_otps", [
            'otp_id'    => $otpRecord->id,
            'tenant_id' => $this->tenantId,
            'user_id'   => $this->userId,
            'email'     => $this->email,
        ]);
    }
}
