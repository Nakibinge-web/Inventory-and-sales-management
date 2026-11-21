<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\TenantSubscription;
use App\Models\SubscriptionHistory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class DeveloperSubscriptionApiTest extends TestCase
{
    use RefreshDatabase;

    private function createDeveloperUser(array $permissions = ['developer.portal.access', 'developer.subscriptions.view', 'developer.subscriptions.manage']): User
    {
        $tenant = Tenant::factory()->create(['name' => 'Host Tenant']);
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $role = Role::firstOrCreate(
            ['name' => 'test-dev-sub-role', 'tenant_id' => $tenant->id],
            ['description' => 'Test Dev Role', 'is_default' => false]
        );

        $permModels = [];
        foreach ($permissions as $permName) {
            $permModels[] = Permission::firstOrCreate(
                ['name' => $permName, 'tenant_id' => null],
                ['display_name' => $permName, 'group' => 'developer', 'is_default' => true]
            );
        }

        $role->permissions()->sync(collect($permModels)->pluck('id'));
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_unauthenticated_requests_are_denied(): void
    {
        $this->getJson('/api/developer/subscriptions')->assertStatus(401);
        $this->getJson('/api/developer/subscriptions/1')->assertStatus(401);
        $this->getJson('/api/developer/tenants/1/subscription')->assertStatus(401);
        $this->postJson('/api/developer/tenants/1/subscription/extend-trial', ['days' => 7])->assertStatus(401);
        $this->postJson('/api/developer/tenants/1/subscription/change-plan', ['plan_name' => 'Enterprise'])->assertStatus(401);
    }

    public function test_developer_missing_granular_permission_is_denied(): void
    {
        // Has portal access, but lacks subscriptions.view
        $devWithoutView = $this->createDeveloperUser(['developer.portal.access']);
        Sanctum::actingAs($devWithoutView);

        $this->getJson('/api/developer/subscriptions')->assertStatus(403);
        $this->getJson('/api/developer/subscriptions/1')->assertStatus(403);
        $this->getJson('/api/developer/tenants/1/subscription')->assertStatus(403);

        // Has subscriptions.view, but lacks subscriptions.manage
        $devWithoutManage = $this->createDeveloperUser(['developer.portal.access', 'developer.subscriptions.view']);
        Sanctum::actingAs($devWithoutManage);

        $this->postJson('/api/developer/tenants/1/subscription/extend-trial', ['days' => 14])->assertStatus(403);
        $this->postJson('/api/developer/tenants/1/subscription/change-plan', ['plan_name' => 'Enterprise'])->assertStatus(403);
    }

    public function test_listing_subscriptions_with_filters_and_pagination(): void
    {
        $tenantA = Tenant::factory()->create(['name' => 'School A']);
        $tenantB = Tenant::factory()->create(['name' => 'School B']);

        TenantSubscription::create([
            'tenant_id' => $tenantA->id,
            'plan_name' => 'Starter',
            'status'    => 'active',
            'starts_at' => now(),
            'expires_at'=> now()->addMonth(),
        ]);

        TenantSubscription::create([
            'tenant_id' => $tenantB->id,
            'plan_name' => 'Enterprise',
            'status'    => 'active',
            'starts_at' => now(),
            'expires_at'=> now()->addYear(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // List all
        $response = $this->getJson('/api/developer/subscriptions');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

        // Filter by plan
        $resFilter = $this->getJson('/api/developer/subscriptions?plan=Enterprise');
        $resFilter->assertStatus(200);
        $this->assertCount(1, $resFilter->json('data'));
        $this->assertEquals('Enterprise', $resFilter->json('data.0.plan_name'));
        $this->assertEquals('School B', $resFilter->json('data.0.tenant.name'));
    }

    public function test_view_subscription_by_id_and_by_tenant_id(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Victoria Primary']);
        $sub = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_name' => 'Trial',
            'status'    => 'trialing',
            'starts_at' => now(),
            'expires_at'=> now()->addDays(14),
        ]);

        SubscriptionHistory::create([
            'tenant_id'   => $tenant->id,
            'actor_id'    => null,
            'event_type'  => 'created',
            'from_plan'   => null,
            'to_plan'     => 'Trial',
            'from_status' => null,
            'to_status'   => 'trialing',
            'reason'      => 'Initial trial',
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // By subscription ID
        $resSub = $this->getJson("/api/developer/subscriptions/{$sub->id}");
        $resSub->assertStatus(200);
        $resSub->assertJson([
            'success' => true,
            'data'    => [
                'id'        => $sub->id,
                'plan_name' => 'Trial',
                'tenant'    => ['name' => 'Victoria Primary'],
            ],
        ]);
        $this->assertNotEmpty($resSub->json('data.history'));

        // By tenant ID
        $resTenant = $this->getJson("/api/developer/tenants/{$tenant->id}/subscription");
        $resTenant->assertStatus(200);
        $resTenant->assertJson([
            'success' => true,
            'data'    => [
                'id'        => $sub->id,
                'plan_name' => 'Trial',
            ],
        ]);
    }

    public function test_extend_trial_successfully_updates_expiration_and_logs_history(): void
    {
        $tenant = Tenant::factory()->create(['name' => 'Makerere Day']);
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $initialSub = TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_name' => 'Trial',
            'status'    => 'trialing',
            'starts_at' => now(),
            'expires_at'=> now()->addDays(5),
        ]);

        $response = $this->postJson("/api/developer/tenants/{$tenant->id}/subscription/extend-trial", [
            'days'   => 15,
            'reason' => 'Customer requested extension for onboarding',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Trial successfully extended by 15 days.',
        ]);

        $freshSub = $initialSub->fresh();
        $this->assertTrue($freshSub->expires_at->gt(now()->addDays(18)));

        // Verify history entry
        $this->assertDatabaseHas('subscription_history', [
            'tenant_id'  => $tenant->id,
            'event_type' => 'trial_extended',
            'actor_id'   => $dev->id,
        ]);

        // Verify audit log
        $this->assertDatabaseHas('activity_logs', [
            'event'     => 'subscription.trial_extended',
            'tenant_id' => $tenant->id,
            'severity'  => 'info',
        ]);
    }

    public function test_extend_trial_validates_days(): void
    {
        $tenant = Tenant::factory()->create();
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Days < 1
        $this->postJson("/api/developer/tenants/{$tenant->id}/subscription/extend-trial", [
            'days' => 0,
        ])->assertStatus(422);

        // Days > 365
        $this->postJson("/api/developer/tenants/{$tenant->id}/subscription/extend-trial", [
            'days' => 500,
        ])->assertStatus(422);
    }

    public function test_change_plan_updates_quotas_syncs_modules_and_logs_history(): void
    {
        $tenant = Tenant::factory()->create([
            'name'            => 'Gulu Modern',
            'enabled_modules' => ['pos' => true, 'sales' => true, 'ai' => false, 'stock-movements' => false],
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->postJson("/api/developer/tenants/{$tenant->id}/subscription/change-plan", [
            'plan_name'     => 'Enterprise',
            'billing_cycle' => 'yearly',
            'reason'        => 'Upgraded to full suite',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'subscription' => [
                    'plan_name'     => 'Enterprise',
                    'billing_cycle' => 'yearly',
                    'max_users'     => 100,
                    'max_products'  => 50000,
                ],
            ],
        ]);

        // Module entitlement synchronization check
        $freshModules = $tenant->fresh()->enabled_modules;
        $this->assertTrue($freshModules['ai']);
        $this->assertTrue($freshModules['stock-movements']);
        $this->assertTrue($freshModules['purchases']);

        // Verify subscription history
        $this->assertDatabaseHas('subscription_history', [
            'tenant_id'  => $tenant->id,
            'event_type' => 'plan_changed',
            'to_plan'    => 'Enterprise',
            'actor_id'   => $dev->id,
        ]);
    }

    public function test_change_plan_rejects_invalid_plan_without_mutating_state(): void
    {
        $tenant = Tenant::factory()->create([
            'name' => 'Soroti Academy',
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->postJson("/api/developer/tenants/{$tenant->id}/subscription/change-plan", [
            'plan_name' => 'UnlimitedHackerPlan',
        ]);

        $response->assertStatus(422);

        // Confirm database did not create erroneous subscription record
        $this->assertDatabaseMissing('tenant_subscriptions', [
            'tenant_id' => $tenant->id,
            'plan_name' => 'UnlimitedHackerPlan',
        ]);
    }

    public function test_missing_tenant_or_subscription_returns_404(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $this->getJson('/api/developer/subscriptions/999999')->assertStatus(404);
        $this->getJson('/api/developer/tenants/999999/subscription')->assertStatus(404);
        $this->postJson('/api/developer/tenants/999999/subscription/extend-trial', ['days' => 7])->assertStatus(404);
        $this->postJson('/api/developer/tenants/999999/subscription/change-plan', ['plan_name' => 'Starter'])->assertStatus(404);
    }
}
