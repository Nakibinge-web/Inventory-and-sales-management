<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class PasswordResetOtp extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'email',
        'otp_hash',
        'reset_token_hash',
        'attempts',
        'verified_at',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'attempts'    => 'integer',
        'verified_at' => 'datetime',
        'expires_at'  => 'datetime',
        'used_at'     => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at === null || now()->greaterThanOrEqualTo($this->expires_at);
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /**
     * Domain-separate and hash an OTP or reset token with the tenant_id and user_id
     * so a code issued to one tenant can never validate against another tenant.
     */
    public static function hashForTenant(int $tenantId, int $userId, string $secret): string
    {
        return Hash::make("{$tenantId}:{$userId}:{$secret}");
    }

    public function matchesOtpForTenant(int $tenantId, int $userId, string $otp): bool
    {
        if ((int) $this->tenant_id !== $tenantId || (int) $this->user_id !== $userId) {
            return false;
        }

        return Hash::check("{$tenantId}:{$userId}:{$otp}", $this->otp_hash);
    }

    public function matchesResetTokenForTenant(int $tenantId, int $userId, string $resetToken): bool
    {
        if ((int) $this->tenant_id !== $tenantId || (int) $this->user_id !== $userId || empty($this->reset_token_hash)) {
            return false;
        }

        return Hash::check("{$tenantId}:{$userId}:{$resetToken}", $this->reset_token_hash);
    }
}
