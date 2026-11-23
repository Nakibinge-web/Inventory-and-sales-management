<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\TenantSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class DeveloperTenantApiTest extends TestCase
{
    use RefreshDatabase;

    private function createDeveloperUser(array $permissions = ['developer.portal.access', 'developer.tenants.view', 'developer.tenants.manage']): User
    {
        $tenant = Tenant::factory()->create(['name' => 'Host Tenant']);
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $role = Role::firstOrCreate(
            ['name' => 'developer', 'tenant_id' => null],
            ['description' => 'Platform Developer', 'is_default' => true]
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
        $this->getJson('/api/developer/tenants')->assertStatus(401);
        $this->getJson('/api/developer/tenants/1')->assertStatus(401);
        $this->patchJson('/api/developer/tenants/1/status', ['status' => 'suspended'])->assertStatus(401);
    }

    public function test_user_without_developer_portal_access_is_denied(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        Sanctum::actingAs($user);

        $this->getJson('/api/developer/tenants')->assertStatus(403);
        $this->getJson("/api/developer/tenants/{$tenant->id}")->assertStatus(403);
        $this->patchJson("/api/developer/tenants/{$tenant->id}/status", ['status' => 'suspended'])->assertStatus(403);
    }

    public function test_developer_missing_granular_permission_is_denied(): void
    {
        // Has portal access, but lacks developer.tenants.view
        $devWithoutView = $this->createDeveloperUser(['developer.portal.access']);
        Sanctum::actingAs($devWithoutView);

        $this->getJson('/api/developer/tenants')->assertStatus(403);
        $this->getJson('/api/developer/tenants/1')->assertStatus(403);

        // Has portal access & view, but lacks developer.tenants.manage
        $devWithoutManage = $this->createDeveloperUser(['developer.portal.access', 'developer.tenants.view']);
        Sanctum::actingAs($devWithoutManage);

        $this->patchJson('/api/developer/tenants/1/status', ['status' => 'suspended'])->assertStatus(403);
    }

    public function test_authorized_developer_can_list_tenants_across_the_platform(): void
    {
        $tenantAlpha = Tenant::factory()->create(['name' => 'Alpha Academy', 'status' => 'active']);
        $tenantBeta  = Tenant::factory()->create(['name' => 'Beta High', 'status' => 'suspended']);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/tenants');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

        $names = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('Alpha Academy', $names);
        $this->assertContains('Beta High', $names);
    }

    public function test_tenant_filtering_by_search_status_and_date(): void
    {
        $tenantAlpha = Tenant::factory()->create([
            'name'       => 'Kampala International',
            'status'     => 'active',
            'created_at' => now()->subDays(5),
        ]);
        $tenantBeta = Tenant::factory()->create([
            'name'       => 'Entebbe Academy',
            'status'     => 'suspended',
            'created_at' => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Search filter
        $resSearch = $this->getJson('/api/developer/tenants?search=Kampala');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertEquals('Kampala International', $resSearch->json('data.0.name'));

        // Status filter
        $resStatus = $this->getJson('/api/developer/tenants?status=suspended');
        $resStatus->assertStatus(200);
        $this->assertCount(1, $resStatus->json('data'));
        $this->assertEquals('Entebbe Academy', $resStatus->json('data.0.name'));

        // Date range filter
        $from = now()->subDays(6)->toDateString();
        $to   = now()->subDays(2)->toDateString();
        $resDate = $this->getJson("/api/developer/tenants?date_from={$from}&date_to={$to}");
        $resDate->assertStatus(200);
        $this->assertCount(1, $resDate->json('data'));
        $this->assertEquals('Kampala International', $resDate->json('data.0.name'));
    }

    public function test_empty_results_returns_empty_collection(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/tenants?search=nonexistent-query-xyz');
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [],
            'pagination' => [
                'current_page' => 1,
                'total'        => 0,
            ],
        ]);
    }

    public function test_show_endpoint_returns_tenant_details_and_metrics(): void
    {
        $tenant = Tenant::factory()->create([
            'name'   => 'St. Jude School',
            'status' => 'active',
        ]);
        User::factory()->count(3)->create(['tenant_id' => $tenant->id]);

        TenantSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_name' => 'Professional',
            'status'    => 'active',
            'starts_at' => now(),
            'expires_at'=> now()->addMonth(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson("/api/developer/tenants/{$tenant->id}");
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'id'     => $tenant->id,
                'name'   => 'St. Jude School',
                'status' => 'active',
                'metrics'=> [
                    'users_count' => 3,
                ],
                'subscription' => [
                    'plan_name' => 'Professional',
                ],
            ],
        ]);
    }

    public function test_show_returns_404_for_missing_tenant(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/tenants/999999');
        $response->assertStatus(404);
        $response->assertJson(['success' => false, 'message' => 'Tenant not found.']);
    }

    public function test_status_update_validates_and_persists_transition(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->patchJson("/api/developer/tenants/{$tenant->id}/status", [
            'status' => 'suspended',
            'reason' => 'Overdue subscription payment',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'id'              => $tenant->id,
                'status'          => 'suspended',
                'previous_status' => 'active',
                'reason'          => 'Overdue subscription payment',
            ],
        ]);

        $this->assertEquals('suspended', $tenant->fresh()->status);

        // Verify audit log
        $this->assertDatabaseHas('activity_logs', [
            'event'     => 'tenant.status_suspended',
            'tenant_id' => $tenant->id,
            'severity'  => 'warning',
        ]);
    }

    public function test_status_update_rejects_invalid_status(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->patchJson("/api/developer/tenants/{$tenant->id}/status", [
            'status' => 'dormant', // invalid status
        ]);

        $response->assertStatus(422);
        $this->assertEquals('active', $tenant->fresh()->status);
    }
}
