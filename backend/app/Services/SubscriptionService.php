<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\SubscriptionHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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

            // Sync tenant modules to match plan entitlements
            if (!empty($planDef['modules'])) {
                $tenant->update(['enabled_modules' => $planDef['modules']]);
            }

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
}
