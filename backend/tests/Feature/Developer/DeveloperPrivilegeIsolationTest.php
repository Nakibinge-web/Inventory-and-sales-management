<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class DeveloperPrivilegeIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_admin_cannot_view_developer_role_in_roles_list(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'tenant_id' => null],
            ['description' => 'Administrator', 'is_default' => true]
        );
        $admin->roles()->attach($adminRole->id);

        // System developer role exists
        $devRole = Role::firstOrCreate(
            ['name' => 'developer', 'tenant_id' => null],
            ['description' => 'Developer', 'is_default' => true]
        );

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/roles');
        $response->assertStatus(200);

        $roleNames = collect($response->json('data'))->pluck('name')->toArray();
        $this->assertContains('admin', $roleNames);
        $this->assertNotContains('developer', $roleNames);
    }

    public function test_tenant_admin_cannot_view_developer_permissions_in_permissions_list(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'tenant_id' => null],
            ['description' => 'Administrator', 'is_default' => true]
        );
        $admin->roles()->attach($adminRole->id);

        Permission::firstOrCreate(
            ['name' => 'developer.portal.access', 'tenant_id' => null],
            ['display_name' => 'Portal Access', 'group' => 'developer', 'is_default' => true]
        );

        Permission::firstOrCreate(
            ['name' => 'products.view', 'tenant_id' => null],
            ['display_name' => 'View Products', 'group' => 'products', 'is_default' => true]
        );

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/permissions');
        $response->assertStatus(200);

        // Developer group must not appear in tenant-accessible permissions
        $groups = array_keys($response->json('data'));
        $this->assertNotContains('developer', $groups);
        $this->assertContains('products', $groups);
    }

    public function test_tenant_admin_cannot_assign_developer_role_to_self_or_other_users(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);
        $owner = User::factory()->create(['tenant_id' => $tenant->id]);
        $targetUser = User::factory()->create(['tenant_id' => $tenant->id]);

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'tenant_id' => null],
            ['description' => 'Administrator', 'is_default' => true]
        );
        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );
        $admin->roles()->attach($adminRole->id);
        $owner->roles()->attach($ownerRole->id);

        $devRole = Role::firstOrCreate(
            ['name' => 'developer', 'tenant_id' => null],
            ['description' => 'Developer', 'is_default' => true]
        );

        // 1. Ordinary admin is rejected by owner middleware (403)
        Sanctum::actingAs($admin);
        $this->postJson('/api/roles/assign', [
            'user_id'  => $targetUser->id,
            'role_ids' => [$devRole->id],
        ])->assertStatus(403);

        // 2. Tenant owner attempts to assign developer role, blocked by visibility check (422)
        Sanctum::actingAs($owner);
        $response = $this->postJson('/api/roles/assign', [
            'user_id'  => $targetUser->id,
            'role_ids' => [$devRole->id],
        ]);
        $response->assertStatus(422);

        $this->assertFalse($targetUser->fresh()->hasRole('developer'));
    }

    public function test_tenant_admin_cannot_assign_developer_permissions_to_custom_role(): void
    {
        $tenant = Tenant::factory()->create();
        $admin = User::factory()->create(['tenant_id' => $tenant->id]);

        $adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'tenant_id' => null],
            ['description' => 'Administrator', 'is_default' => true]
        );
        $admin->roles()->attach($adminRole->id);

        $customRole = Role::create([
            'name'       => 'store-super',
            'tenant_id'  => $tenant->id,
            'is_default' => false,
        ]);

        $devPerm = Permission::firstOrCreate(
            ['name' => 'developer.telemetry.view', 'tenant_id' => null],
            ['display_name' => 'View Telemetry', 'group' => 'developer', 'is_default' => true]
        );

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/permissions/assign', [
            'role_id'        => $customRole->id,
            'permission_ids' => [$devPerm->id],
        ]);

        $response->assertStatus(422);
        $this->assertFalse($customRole->permissions()->where('permissions.id', $devPerm->id)->exists());
    }
}
