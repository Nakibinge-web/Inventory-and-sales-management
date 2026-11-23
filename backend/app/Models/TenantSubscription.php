<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantSubscription extends Model
{
    protected $table = 'tenant_subscriptions';

    protected $fillable = [
        'tenant_id',
        'plan_name',
        'status',
        'starts_at',
        'expires_at',
        'max_users',
        'max_products',
        'price',
        'currency',
        'billing_cycle',
        'is_complimentary',
        'notes',
    ];

    protected $casts = [
        'starts_at'         => 'datetime',
        'expires_at'        => 'datetime',
        'max_users'         => 'integer',
        'max_products'      => 'integer',
        'price'             => 'decimal:2',
        'is_complimentary'  => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(SubscriptionHistory::class, 'tenant_id', 'tenant_id')->orderByDesc('created_at');
    }

    public function isActive(): bool
    {
        if ($this->status !== 'active' && $this->status !== 'trialing') {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function isTrialing(): bool
    {
        return $this->status === 'trialing' && (!$this->expires_at || $this->expires_at->isFuture());
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->expires_at && $this->expires_at->isPast());
    }

    public function effectiveStatus(): string
    {
        $status = strtolower((string) $this->status);
        if ($status === 'trial') {
            $status = 'trialing';
        }

        if ($this->expires_at && $this->expires_at->isPast() && in_array($status, ['active', 'trialing'], true)) {
            return 'expired';
        }

        return $status ?: 'inactive';
    }

    public function daysRemaining(): ?int
    {
        if (!$this->expires_at) {
            return null;
        }

        $seconds = $this->expires_at->getTimestamp() - now()->getTimestamp();
        if ($seconds <= 0 || in_array($this->effectiveStatus(), ['expired', 'canceled', 'cancelled'], true)) {
            return 0;
        }

        return (int) ceil($seconds / 86400);
    }
}
