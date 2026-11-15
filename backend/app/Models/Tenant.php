<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Tenant extends Model
{
    use HasFactory;

    public const MONTHLY_DAYS = 30;
    public const ANNUAL_DAYS = 365;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'contacts',
        'address',
        'logo_path',
        'subscription_plan',
        'subscription_status',
        'subscription_expires_at',
    ];

    protected $casts = [
        'contacts'                => 'array',
        'subscription_expires_at' => 'datetime',
    ];

    protected $appends = [
        'logo_url',
        'is_subscription_expired',
    ];

    public function getIsSubscriptionExpiredAttribute(): bool
    {
        return $this->isSubscriptionExpired();
    }

    /**
     * Determine whether the tenant's subscription period has ended.
     */
    public function isSubscriptionExpired(): bool
    {
        $status = strtolower((string) $this->subscription_status);

        if (in_array($status, ['expired', 'cancelled', 'canceled', 'suspended', 'past_due'], true)) {
            return true;
        }

        if ($this->subscription_expires_at !== null) {
            return now()->greaterThanOrEqualTo($this->subscription_expires_at);
        }

        return false;
    }

    public static function durationDaysForCycle(?string $billingCycle): int
    {
        return strtolower(trim((string) $billingCycle)) === 'annual'
            ? self::ANNUAL_DAYS
            : self::MONTHLY_DAYS;
    }

    public function remainingSubscriptionDays(): int
    {
        if ($this->isSubscriptionExpired() || $this->subscription_expires_at === null) {
            return 0;
        }

        $secondsRemaining = $this->subscription_expires_at->getTimestamp() - now()->getTimestamp();
        if ($secondsRemaining <= 0) {
            return 0;
        }

        return (int) ceil($secondsRemaining / 86400);
    }

    /**
     * Compute the new expiry timestamp for a subscription purchase.
     *
     * When the tenant is already active on the same package with remaining time,
     * the new cycle's days are stacked on top of the current expiration date.
     */
    public function calculateExtendedExpiry(string $planId, ?string $billingCycle = 'monthly'): Carbon
    {
        $durationDays = self::durationDaysForCycle($billingCycle);
        $currentPlan  = strtolower(trim((string) $this->subscription_plan));
        $targetPlan   = strtolower(trim($planId));
        $now          = now();

        if (
            !$this->isSubscriptionExpired()
            && $currentPlan !== ''
            && $currentPlan === $targetPlan
            && $this->subscription_expires_at !== null
            && $this->subscription_expires_at->greaterThan($now)
        ) {
            return $this->subscription_expires_at->copy()->addDays($durationDays);
        }

        return $now->copy()->addDays($durationDays);
    }

    public function applySubscriptionPurchase(string $planId, ?string $billingCycle = 'monthly'): Carbon
    {
        $targetPlan = strtolower(trim($planId));
        $expiresAt  = $this->calculateExtendedExpiry($targetPlan, $billingCycle);

        $this->update([
            'subscription_plan'       => $targetPlan,
            'subscription_status'     => 'active',
            'subscription_expires_at' => $expiresAt,
        ]);

        return $expiresAt;
    }

    public function effectiveSubscriptionStatus(): string
    {
        $status = strtolower((string) ($this->subscription_status ?: 'inactive'));

        if ($this->isSubscriptionExpired() && in_array($status, ['active', 'trial', 'inactive', ''], true)) {
            return 'expired';
        }

        return $status;
    }

    public function expiredSubscriptionMessage(bool $isOwner = true): string
    {
        if ($isOwner) {
            return 'Your subscription period has ended. Please subscribe to a plan to continue using StockPro.';
        }

        return 'Your business subscription period has ended. Please subscribe to a plan or ask your business owner to subscribe to continue using the application.';
    }

    public function subscriptionBlockedPayload(bool $isOwner = true, bool $includeRenewalToken = false): array
    {
        $effectiveStatus = $this->effectiveSubscriptionStatus();

        $payload = [
            'success'              => false,
            'code'                 => 'SUBSCRIPTION_EXPIRED',
            'subscription_expired' => true,
            'is_owner'             => $isOwner,
            'message'              => $this->expiredSubscriptionMessage($isOwner),
            'subscription'         => [
                'plan'       => $this->subscription_plan,
                'status'     => $effectiveStatus,
                'expires_at' => $this->subscription_expires_at,
            ],
            'tenant'               => [
                'id'                      => $this->id,
                'name'                    => $this->name,
                'email'                   => $this->email,
                'phone'                   => $this->phone,
                'subscription_plan'       => $this->subscription_plan,
                'subscription_status'     => $effectiveStatus,
                'subscription_expires_at' => $this->subscription_expires_at,
                'is_subscription_expired' => true,
            ],
        ];

        if ($includeRenewalToken) {
            $payload['renewal_token'] = \Illuminate\Support\Facades\Crypt::encryptString((string) $this->id);
        }

        return $payload;
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo_path) {
            return null;
        }

        if (filter_var($this->logo_path, FILTER_VALIDATE_URL) || str_starts_with($this->logo_path, 'data:image/')) {
            return $this->logo_path;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->logo_path);
    }

    // Relationships
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
