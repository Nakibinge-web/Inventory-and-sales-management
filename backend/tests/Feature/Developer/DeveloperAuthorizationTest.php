<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class DeveloperAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_requests_to_developer_routes_are_rejected(): void
    {
        $response = $this->getJson('/api/developer/ping');
        $response->assertStatus(401);
    }

    public function test_ordinary_tenant_user_without_developer_permission_is_denied(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/developer/ping');
        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Access denied. Developer privileges required.',
        ]);
    }

    public function test_authorized_developer_can_access_developer_routes(): void
    {
        $tenant = Tenant::factory()->create();
        $developer = User::factory()->create(['tenant_id' => $tenant->id]);

        $role = Role::firstOrCreate(
            ['name' => 'developer', 'tenant_id' => null],
            ['description' => 'Platform Developer', 'is_default' => true]
        );

        $perm = Permission::firstOrCreate(
            ['name' => 'developer.portal.access', 'tenant_id' => null],
            ['display_name' => 'Access Developer Portal', 'group' => 'developer', 'is_default' => true]
        );

        $role->permissions()->syncWithoutDetaching([$perm->id]);
        $developer->roles()->attach($role->id);

        Sanctum::actingAs($developer);

        $response = $this->getJson('/api/developer/ping');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $statsRes = $this->getJson('/api/developer/dashboard/stats');
        $statsRes->assertStatus(200);
        $statsRes->assertJsonStructure([
            'success',
            'data' => [
                'tenants' => ['total', 'active', 'suspended', 'cancelled'],
                'subscriptions' => ['total', 'active', 'trialing', 'expired'],
                'telemetry_24h' => ['total_requests', 'errors', 'slow_requests', 'avg_latency_ms'],
                'recent_errors',
                'recent_activity',
            ],
        ]);
    }

    public function test_tenant_suspension_denies_ordinary_tenant_requests(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'suspended']);
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/health');
        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Your business account has been suspended. Please contact platform administration.',
        ]);
    }
}
