<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;

class SubscriptionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_or_create_subscription_provisions_default_trial(): void
    {
        $tenant = Tenant::factory()->create();
        $service = new SubscriptionService();

        $sub = $service->getOrCreateSubscription($tenant);

        $this->assertEquals('Trial', $sub->plan_name);
        $this->assertEquals('trialing', $sub->status);
        $this->assertTrue($sub->expires_at->isFuture());

        $this->assertDatabaseHas('tenant_subscriptions', [
            'tenant_id' => $tenant->id,
            'plan_name' => 'Trial',
            'status'    => 'trialing',
        ]);

        $this->assertDatabaseHas('subscription_history', [
            'tenant_id'  => $tenant->id,
            'event_type' => 'created',
            'to_plan'    => 'Trial',
        ]);
    }

    public function test_extend_trial_updates_expiration_and_logs_history(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);
        $service = new SubscriptionService();

        $sub = $service->extendTrial($tenant, 14, 'Customer requested extension', $admin);

        $this->assertEquals('trialing', $sub->status);
        $this->assertTrue($sub->expires_at->isAfter(now()->addDays(13)));

        $this->assertDatabaseHas('subscription_history', [
            'tenant_id'  => $tenant->id,
            'actor_id'   => $admin->id,
            'event_type' => 'trial_extended',
            'reason'     => 'Customer requested extension',
        ]);
    }

    public function test_change_plan_updates_quotas_and_syncs_modules(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);
        $service = new SubscriptionService();

        $sub = $service->changePlan($tenant, 'Professional', [], 'Customer upgraded', $admin);

        $this->assertEquals('Professional', $sub->plan_name);
        $this->assertEquals('active', $sub->status);
        $this->assertEquals(10, $sub->max_users);
        $this->assertEquals(2500, $sub->max_products);

        $tenant->refresh();
        $modules = $tenant->enabled_modules;
        $this->assertTrue($modules['pos']);
        $this->assertTrue($modules['purchases']);
        $this->assertFalse($modules['ai']); // Professional does not include AI by default
    }

    public function test_invalid_plan_throws_exception(): void
    {
        $tenant = Tenant::factory()->create();
        $service = new SubscriptionService();

        $this->expectException(InvalidArgumentException::class);
        $service->changePlan($tenant, 'NonExistentPlan');
    }
}
