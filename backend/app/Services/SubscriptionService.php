<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\SubscriptionHistory;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class SubscriptionService
{
    public const PLANS = [
        'Trial' => [
            'name'         => 'Trial',
            'max_users'    => 5,
            'max_products' => 500,
            'price'        => 0.00,
            'currency'     => 'UGX',
            'modules'      => [
                'pos' => true, 'products' => true, 'categories' => true, 'suppliers' => true,
                'customers' => true, 'sales' => true, 'invoices' => true, 'purchases' => true,
                'stock-movements' => true, 'reports' => true, 'ai' => true,
            ],
        ],
        'Starter' => [
            'name'         => 'Starter',
            'max_users'    => 3,
            'max_products' => 250,
            'price'        => 50000.00,
            'currency'     => 'UGX',
            'modules'      => [
                'pos' => true, 'products' => true, 'categories' => true, 'suppliers' => true,
                'customers' => true, 'sales' => true, 'invoices' => true, 'purchases' => false,
                'stock-movements' => false, 'reports' => true, 'ai' => false,
            ],
        ],
        'Business' => [
            'name'         => 'Business',
            'max_users'    => 10,
            'max_products' => 10000,
            'price'        => 2000.00,
            'currency'     => 'UGX',
            'modules'      => [
                'pos' => true, 'products' => true, 'categories' => true, 'suppliers' => true,
                'customers' => true, 'sales' => true, 'invoices' => true, 'purchases' => true,
                'stock-movements' => true, 'reports' => true, 'ai' => true,
            ],
        ],
        'Professional' => [
            'name'         => 'Professional',
            'max_users'    => 10,
            'max_products' => 2500,
            'price'        => 120000.00,
            'currency'     => 'UGX',
            'modules'      => [
                'pos' => true, 'products' => true, 'categories' => true, 'suppliers' => true,
                'customers' => true, 'sales' => true, 'invoices' => true, 'purchases' => true,
                'stock-movements' => true, 'reports' => true, 'ai' => false,
            ],
        ],
        'Enterprise' => [
            'name'         => 'Enterprise',
            'max_users'    => 100,
            'max_products' => 50000,
            'price'        => 300000.00,
            'currency'     => 'UGX',
            'modules'      => [
                'pos' => true, 'products' => true, 'categories' => true, 'suppliers' => true,
                'customers' => true, 'sales' => true, 'invoices' => true, 'purchases' => true,
                'stock-movements' => true, 'reports' => true, 'ai' => true,
            ],
        ],
    ];

    public static function resolvePlanKey(?string $rawPlan): ?string
    {
        $clean = strtolower(trim((string) $rawPlan));
        if ($clean === '') {
            return null;
        }

        $clean = preg_replace('/\s+plan$/', '', $clean);

        foreach (array_keys(self::PLANS) as $key) {
            if (strtolower($key) === $clean) {
                return $key;
            }
        }

        return ucfirst($clean);
    }

    public static function normalizeStatus(?string $rawStatus, $expiresAt = null): string
    {
        $status = strtolower(trim((string) $rawStatus));
        if ($status === 'trial') {
            $status = 'trialing';
        } elseif ($status === 'cancelled') {
            $status = 'canceled';
        }

        if ($status === '' || $status === 'inactive') {
            return 'inactive';
        }

        if ($expiresAt !== null) {
            $exp = $expiresAt instanceof Carbon ? $expiresAt : Carbon::parse($expiresAt);
            if ($exp->isPast() && in_array($status, ['active', 'trialing'], true)) {
                return 'expired';
            }
        }

        return $status;
    }

    /**
     * Get or initialize a default 14-day trial subscription for a tenant.
     */
    public function getOrCreateSubscription(Tenant $tenant): TenantSubscription
    {
        $existing = TenantSubscription::where('tenant_id', $tenant->id)->first();
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($tenant) {
            $plan = self::PLANS['Trial'];

            $sub = TenantSubscription::create([
                'tenant_id'        => $tenant->id,
                'plan_name'        => 'Trial',
                'status'           => 'trialing',
                'starts_at'        => now(),
                'expires_at'       => now()->addDays(14),
                'max_users'        => $plan['max_users'],
                'max_products'     => $plan['max_products'],
                'price'            => $plan['price'],
                'currency'         => $plan['currency'],
                'billing_cycle'    => 'monthly',
                'is_complimentary' => false,
            ]);

            SubscriptionHistory::create([
                'tenant_id'   => $tenant->id,
                'actor_id'    => null,
                'event_type'  => 'created',
                'from_plan'   => null,
                'to_plan'     => 'Trial',
                'from_status' => null,
                'to_status'   => 'trialing',
                'reason'      => 'Initial tenant trial provisioning',
                'properties'  => ['expires_at' => $sub->expires_at->toIso8601String()],
                'created_at'  => now(),
            ]);

            AuditLogService::log('subscription.created', "Provisioned 14-day trial for tenant {$tenant->name}", [
                'tenant_id'   => $tenant->id,
                'target_type' => TenantSubscription::class,
                'target_id'   => $sub->id,
            ]);

            return $sub;
        });
    }

    /**
     * Extend a tenant's trial by N days within a database transaction.
     */
    public function extendTrial(Tenant $tenant, int $days, ?string $reason = null, ?User $actor = null): TenantSubscription
    {
        if ($days <= 0 || $days > 365) {
            throw new InvalidArgumentException('Extension days must be between 1 and 365.');
        }

        return DB::transaction(function () use ($tenant, $days, $reason, $actor) {
            $sub = $this->getOrCreateSubscription($tenant);

            $oldStatus = $sub->status;
            $oldExpires = $sub->expires_at;

            $baseDate = ($sub->expires_at && $sub->expires_at->isFuture()) ? $sub->expires_at : now();
            $newExpires = $baseDate->copy()->addDays($days);

            $sub->update([
                'status'     => 'trialing',
                'expires_at' => $newExpires,
                'notes'      => $reason ? trim($sub->notes . "\n" . now()->toDateString() . ": {$reason}") : $sub->notes,
            ]);

            $tenant->update([
                'subscription_plan'       => strtolower((string) $sub->plan_name),
                'subscription_status'     => 'trial',
                'subscription_expires_at' => $newExpires,
            ]);

            SubscriptionHistory::create([
                'tenant_id'   => $tenant->id,
                'actor_id'    => $actor?->id,
                'event_type'  => 'trial_extended',
                'from_plan'   => $sub->plan_name,
                'to_plan'     => $sub->plan_name,
                'from_status' => $oldStatus,
                'to_status'   => 'trialing',
                'reason'      => $reason ?: "Trial extended by {$days} days",
                'properties'  => [
                    'days_added'     => $days,
                    'old_expires_at' => $oldExpires?->toIso8601String(),
                    'new_expires_at' => $newExpires->toIso8601String(),
                ],
                'created_at'  => now(),
            ]);

            AuditLogService::log('subscription.trial_extended', "Extended trial for tenant {$tenant->name} by {$days} days", [
                'actor_id'    => $actor?->id,
                'tenant_id'   => $tenant->id,
                'target_type' => TenantSubscription::class,
                'target_id'   => $sub->id,
                'properties'  => ['days' => $days, 'new_expires_at' => $newExpires->toIso8601String(), 'reason' => $reason],
            ]);

            return $sub->fresh();
        });
    }

    /**
     * Change a tenant's subscription plan transactionally and sync enabled modules.
     */
    public function changePlan(Tenant $tenant, string $newPlanName, array $options = [], ?string $reason = null, ?User $actor = null): TenantSubscription
    {
        if (!isset(self::PLANS[$newPlanName])) {
            throw new InvalidArgumentException("Invalid plan name: {$newPlanName}. Available: " . implode(', ', array_keys(self::PLANS)));
        }

        return DB::transaction(function () use ($tenant, $newPlanName, $options, $reason, $actor) {
            $sub = $this->getOrCreateSubscription($tenant);
            $planDef = self::PLANS[$newPlanName];

            $oldPlan = $sub->plan_name;
            $oldStatus = $sub->status;

            $status = $options['status'] ?? ($newPlanName === 'Trial' ? 'trialing' : 'active');
            $billingCycle = $options['billing_cycle'] ?? $sub->billing_cycle;
            $isComplimentary = $options['is_complimentary'] ?? false;
            $expiresAt = $newPlanName === 'Trial'
                ? now()->addDays(14)
                : ($billingCycle === 'yearly' ? now()->addYear() : now()->addMonth());

            $sub->update([
                'plan_name'        => $newPlanName,
                'status'           => $status,
                'starts_at'        => now(),
                'expires_at'       => $expiresAt,
                'max_users'        => $options['max_users'] ?? $planDef['max_users'],
                'max_products'     => $options['max_products'] ?? $planDef['max_products'],
                'price'            => $isComplimentary ? 0.00 : ($options['price'] ?? $planDef['price']),
                'currency'         => $options['currency'] ?? $planDef['currency'],
                'billing_cycle'    => $billingCycle,
                'is_complimentary' => $isComplimentary,
            ]);

            $tenantUpdates = [
                'subscription_plan'       => strtolower($newPlanName),
                'subscription_status'     => $status === 'trialing' ? 'trial' : $status,
                'subscription_expires_at' => $expiresAt,
            ];

            // Sync tenant modules to match plan entitlements
            if (!empty($planDef['modules'])) {
                $tenantUpdates['enabled_modules'] = $planDef['modules'];
            }

            $tenant->update($tenantUpdates);

            SubscriptionHistory::create([
                'tenant_id'   => $tenant->id,
                'actor_id'    => $actor?->id,
                'event_type'  => 'plan_changed',
                'from_plan'   => $oldPlan,
                'to_plan'     => $newPlanName,
                'from_status' => $oldStatus,
                'to_status'   => $status,
                'reason'      => $reason ?: "Plan changed to {$newPlanName}",
                'properties'  => [
                    'billing_cycle'    => $billingCycle,
                    'is_complimentary' => $isComplimentary,
                    'max_users'        => $sub->max_users,
                    'max_products'     => $sub->max_products,
                ],
                'created_at'  => now(),
            ]);

            AuditLogService::log('subscription.plan_changed', "Changed plan for tenant {$tenant->name} from {$oldPlan} to {$newPlanName}", [
                'actor_id'    => $actor?->id,
                'tenant_id'   => $tenant->id,
                'target_type' => TenantSubscription::class,
                'target_id'   => $sub->id,
                'properties'  => ['from_plan' => $oldPlan, 'to_plan' => $newPlanName, 'reason' => $reason],
            ]);

            return $sub->fresh();
        });
    }

    /**
     * Synchronize a Tenant's package columns (from checkout/registration) into tenant_subscriptions.
     */
    public function syncFromTenant(Tenant $tenant, ?string $billingCycle = null, ?string $reason = null, ?User $actor = null): ?TenantSubscription
    {
        if (!Schema::hasTable('tenant_subscriptions')) {
            return null;
        }

        $planName = self::resolvePlanKey($tenant->subscription_plan);
        $rawStatus = strtolower(trim((string) $tenant->subscription_status));
        $existing = TenantSubscription::where('tenant_id', $tenant->id)->first();

        $hasTenantSub = $planName !== null
            || $tenant->subscription_expires_at !== null
            || in_array($rawStatus, ['active', 'trial', 'trialing', 'expired', 'past_due'], true);

        if (!$hasTenantSub && !$existing) {
            return null;
        }

        $resolvedPlan = $planName ?: ($existing?->plan_name ?? 'Trial');
        $planDef = self::PLANS[$resolvedPlan] ?? [
            'max_users'    => $existing?->max_users ?? 5,
            'max_products' => $existing?->max_products ?? 500,
            'price'        => $existing?->price ?? 0.00,
            'currency'     => $existing?->currency ?? 'UGX',
        ];

        $normalizedStatus = self::normalizeStatus($tenant->subscription_status, $tenant->subscription_expires_at);
        if ($normalizedStatus === 'inactive' && $tenant->subscription_expires_at !== null) {
            $normalizedStatus = $tenant->subscription_expires_at->isPast() ? 'expired' : 'active';
        }

        $cycle = strtolower(trim((string) ($billingCycle ?: $this->inferBillingCycleFromPayments($tenant) ?: ($existing?->billing_cycle ?? 'monthly'))));
        if ($cycle === 'annual') {
            $cycle = 'yearly';
        }

        $paidAmount = $this->inferAmountFromPayments($tenant);
        $price = $paidAmount !== null ? $paidAmount : (float) ($planDef['price'] ?? 0);

        $targetExpiresAt = $tenant->subscription_expires_at;

        if ($existing) {
            $existingExpiresTs = $existing->expires_at?->getTimestamp();
            $targetExpiresTs = $targetExpiresAt?->getTimestamp();
            $noChange = $existing->plan_name === $resolvedPlan
                && $existing->status === $normalizedStatus
                && $existingExpiresTs === $targetExpiresTs
                && ($billingCycle === null || $existing->billing_cycle === $cycle);

            if ($noChange) {
                return $existing;
            }
        }

        return DB::transaction(function () use ($tenant, $existing, $resolvedPlan, $normalizedStatus, $targetExpiresAt, $planDef, $price, $cycle, $reason, $actor) {
            $oldPlan = $existing?->plan_name;
            $oldStatus = $existing?->status;

            if ($existing) {
                $existing->update([
                    'plan_name'     => $resolvedPlan,
                    'status'        => $normalizedStatus,
                    'starts_at'     => $existing->starts_at ?? now(),
                    'expires_at'    => $targetExpiresAt,
                    'max_users'     => $planDef['max_users'],
                    'max_products'  => $planDef['max_products'],
                    'price'         => $price,
                    'currency'      => $planDef['currency'],
                    'billing_cycle' => $cycle,
                ]);
                $sub = $existing->fresh();
                $eventType = $oldPlan !== $resolvedPlan ? 'plan_changed' : 'renewed';
            } else {
                $sub = TenantSubscription::create([
                    'tenant_id'        => $tenant->id,
                    'plan_name'        => $resolvedPlan,
                    'status'           => $normalizedStatus,
                    'starts_at'        => $tenant->created_at ?? now(),
                    'expires_at'       => $targetExpiresAt,
                    'max_users'        => $planDef['max_users'],
                    'max_products'     => $planDef['max_products'],
                    'price'            => $price,
                    'currency'         => $planDef['currency'],
                    'billing_cycle'    => $cycle,
                    'is_complimentary' => false,
                ]);
                $eventType = 'created';
            }

            if (Schema::hasTable('subscription_history')) {
                SubscriptionHistory::create([
                    'tenant_id'   => $tenant->id,
                    'actor_id'    => $actor?->id,
                    'event_type'  => $eventType,
                    'from_plan'   => $oldPlan,
                    'to_plan'     => $resolvedPlan,
                    'from_status' => $oldStatus,
                    'to_status'   => $normalizedStatus,
                    'reason'      => $reason ?: "Synced tenant subscription ({$resolvedPlan})",
                    'properties'  => [
                        'billing_cycle' => $cycle,
                        'expires_at'    => $targetExpiresAt?->toIso8601String(),
                    ],
                    'created_at'  => now(),
                ]);
            }

            return $sub;
        });
    }

    /**
     * Backfill or synchronize any tenants with package subscriptions missing or stale in tenant_subscriptions.
     */
    public function syncMissingFromTenants(): void
    {
        if (!Schema::hasTable('tenant_subscriptions')) {
            return;
        }

        $tenants = Tenant::query()
            ->where(function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNotNull('subscription_plan')->where('subscription_plan', '!=', '');
                })
                ->orWhereNotNull('subscription_expires_at')
                ->orWhereIn(DB::raw('LOWER(COALESCE(subscription_status, ""))'), ['active', 'trial', 'trialing', 'expired', 'past_due']);
            })
            ->with('subscription')
            ->get();

        foreach ($tenants as $tenant) {
            $sub = $tenant->subscription;
            $expectedPlan = self::resolvePlanKey($tenant->subscription_plan);
            $expectedStatus = self::normalizeStatus($tenant->subscription_status, $tenant->subscription_expires_at);
            $tenantExpTs = $tenant->subscription_expires_at?->getTimestamp();
            $subExpTs = $sub?->expires_at?->getTimestamp();

            if (
                !$sub
                || ($expectedPlan !== null && strcasecmp((string) $sub->plan_name, $expectedPlan) !== 0)
                || $sub->status !== $expectedStatus
                || ($tenantExpTs !== null && $tenantExpTs !== $subExpTs)
            ) {
                $this->syncFromTenant($tenant);
            }
        }
    }

    protected function inferBillingCycleFromPayments(Tenant $tenant): ?string
    {
        try {
            if (Schema::hasTable('nexumpay_transactions')) {
                $tx = DB::table('nexumpay_transactions')
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'SUCCESSFUL')
                    ->orderByDesc('id')
                    ->value('billing_cycle');
                if ($tx) {
                    return (string) $tx;
                }
            }
            if (Schema::hasTable('momo_transactions')) {
                $tx = DB::table('momo_transactions')
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'SUCCESSFUL')
                    ->orderByDesc('id')
                    ->value('billing_cycle');
                if ($tx) {
                    return (string) $tx;
                }
            }
        } catch (\Throwable $e) {
            // Optional payment tables
        }

        return null;
    }

    protected function inferAmountFromPayments(Tenant $tenant): ?float
    {
        try {
            if (Schema::hasTable('nexumpay_transactions')) {
                $amt = DB::table('nexumpay_transactions')
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'SUCCESSFUL')
                    ->orderByDesc('id')
                    ->value('amount');
                if ($amt !== null) {
                    return (float) $amt;
                }
            }
            if (Schema::hasTable('momo_transactions')) {
                $amt = DB::table('momo_transactions')
                    ->where('tenant_id', $tenant->id)
                    ->where('status', 'SUCCESSFUL')
                    ->orderByDesc('id')
                    ->value('amount');
                if ($amt !== null) {
                    return (float) $amt;
                }
            }
        } catch (\Throwable $e) {
            // Optional payment tables
        }

        return null;
    }
}
