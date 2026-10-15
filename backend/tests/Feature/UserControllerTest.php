<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── HELPERS ─────────────────────────────────────────────────────

    /**
     * Create a tenant, an owner role (or reuse an existing one),
     * and an owner user linked to that tenant.
     *
     * @return array{0: User, 1: Tenant}
     */
    private function createOwner(): array
    {
        $tenant = Tenant::create([
            'name'  => 'Test Business ' . uniqid(),
            'email' => 'biz_' . uniqid() . '@example.com',
        ]);

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Owner User',
            'email'     => 'owner_' . uniqid() . '@example.com',
            'username'  => 'owner_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);

        $owner->roles()->attach($ownerRole->id);

        return [$owner, $tenant];
    }

    /**
     * Create a staff (non-owner) user in the given tenant.
     */
    private function createStaff(Tenant $tenant): User
    {
        $staffRole = Role::firstOrCreate(
            ['name' => 'staff', 'tenant_id' => null],
            ['description' => 'Staff', 'is_default' => true]
        );

        $staff = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Staff User',
            'email'     => 'staff_' . uniqid() . '@example.com',
            'username'  => 'staff_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);

        $staff->roles()->attach($staffRole->id);

        return $staff;
    }

    /**
     * Return a Bearer-token auth header for the given user.
     */
    private function tokenFor(User $user): array
    {
        $token = $user->createToken('test-token')->plainTextToken;
        return ['Authorization' => 'Bearer ' . $token];
    }

    // ── TESTS ────────────────────────────────────────────────────────

    /** 1. Owner can disable an active staff member */
    public function test_owner_can_disable_active_user(): void
    {
        [$owner, $tenant] = $this->createOwner();
        $staff = $this->createStaff($tenant);

        $response = $this->postJson(
            "/api/users/{$staff->id}/disable",
            [],
            $this->tokenFor($owner)
        );

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'id'        => $staff->id,
            'is_active' => false,
        ]);
    }

    /** 2. Owner can re-enable a disabled staff member */
    public function test_owner_can_enable_disabled_user(): void
    {
        [$owner, $tenant] = $this->createOwner();
        $staff = $this->createStaff($tenant);

        // Pre-disable
        $staff->is_active = false;
        $staff->save();

        $response = $this->postJson(
            "/api/users/{$staff->id}/enable",
            [],
            $this->tokenFor($owner)
        );

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'id'        => $staff->id,
            'is_active' => true,
        ]);
    }

    /** 3. Disabled user cannot log in with email */
    public function test_disabled_user_cannot_login_with_email(): void
    {
        $this->createOwner(); // ensures the 'owner' role exists so registration works

        $tenant = Tenant::create([
            'name'  => 'Disabled Biz',
            'email' => 'disabled_biz@example.com',
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Inactive User',
            'email'     => 'inactive@example.com',
            'username'  => 'inactiveuser',
            'password'  => Hash::make('Password1!'),
        ]);
        $user->is_active = false;
        $user->save();

        $this->postJson('/api/login', [
            'login'    => 'inactive@example.com',
            'password' => 'Password1!',
        ])->assertStatus(403)
          ->assertJsonPath('success', false);
    }

    /** 4. Disabled user cannot log in with username */
    public function test_disabled_user_cannot_login_with_username(): void
    {
        $tenant = Tenant::create([
            'name'  => 'Disabled Biz 2',
            'email' => 'disabled_biz2@example.com',
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Inactive User 2',
            'email'     => 'inactive2@example.com',
            'username'  => 'inactiveuser2',
            'password'  => Hash::make('Password1!'),
        ]);
        $user->is_active = false;
        $user->save();

        $this->postJson('/api/login', [
            'login'    => 'inactiveuser2',
            'password' => 'Password1!',
        ])->assertStatus(403)
          ->assertJsonPath('success', false);
    }

    /** 5. Disabled user's existing token is rejected on authenticated requests */
    public function test_disabled_user_existing_token_is_rejected(): void
    {
        [$owner, $tenant] = $this->createOwner();
        $staff = $this->createStaff($tenant);

        // Mint a token before disabling
        $headers = $this->tokenFor($staff);

        // Disable the user
        $staff->is_active = false;
        $staff->save();

        // Pre-existing token should now be blocked by EnsureTenantMiddleware
        $this->getJson('/api/users', $headers)
             ->assertStatus(403);
    }

    /** 6. Disabling a user revokes all their existing Sanctum tokens */
    public function test_disabling_user_revokes_tokens(): void
    {
        [$owner, $tenant] = $this->createOwner();
        $staff = $this->createStaff($tenant);

        // Create two tokens for the staff member
        $staff->createToken('token-a');
        $staff->createToken('token-b');

        $this->assertEquals(2, $staff->tokens()->count());

        $this->postJson(
            "/api/users/{$staff->id}/disable",
            [],
            $this->tokenFor($owner)
        )->assertStatus(200);

        // All tokens for the staff user should now be gone
        $this->assertEquals(0, $staff->fresh()->tokens()->count());
    }

    /** 7. Non-owner (staff) cannot disable another user */
    public function test_non_owner_cannot_disable_user(): void
    {
        [$owner, $tenant] = $this->createOwner();
        $staff1 = $this->createStaff($tenant);
        $staff2 = $this->createStaff($tenant);

        $this->postJson(
            "/api/users/{$staff2->id}/disable",
            [],
            $this->tokenFor($staff1)
        )->assertStatus(403);
    }

    /** 8. Non-owner (staff) cannot enable a disabled user */
    public function test_non_owner_cannot_enable_user(): void
    {
        [$owner, $tenant] = $this->createOwner();
        $staff1 = $this->createStaff($tenant);
        $staff2 = $this->createStaff($tenant);

        $staff2->is_active = false;
        $staff2->save();

        $this->postJson(
            "/api/users/{$staff2->id}/enable",
            [],
            $this->tokenFor($staff1)
        )->assertStatus(403);
    }

    /** 9. Owner cannot disable themselves */
    public function test_owner_cannot_disable_themselves(): void
    {
        [$owner, $tenant] = $this->createOwner();

        $this->postJson(
            "/api/users/{$owner->id}/disable",
            [],
            $this->tokenFor($owner)
        )->assertStatus(422)
         ->assertJsonPath('success', false);
    }

    /** 10. Owner cannot disable another owner in the same tenant */
    public function test_owner_cannot_disable_another_owner(): void
    {
        [$owner, $tenant] = $this->createOwner();

        // Create a second owner in the same tenant
        $ownerRole = Role::where('name', 'owner')->first();
        $owner2 = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Second Owner',
            'email'     => 'owner2_' . uniqid() . '@example.com',
            'username'  => 'owner2_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $owner2->roles()->attach($ownerRole->id);

        $this->postJson(
            "/api/users/{$owner2->id}/disable",
            [],
            $this->tokenFor($owner)
        )->assertStatus(422)
         ->assertJsonPath('success', false);
    }

    /** 11. Targeting a user from a different tenant returns 404 */
    public function test_cross_tenant_user_returns_404(): void
    {
        [$owner, $tenant]         = $this->createOwner();
        [$otherOwner, $otherTenant] = $this->createOwner();
        $otherStaff = $this->createStaff($otherTenant);

        $this->postJson(
            "/api/users/{$otherStaff->id}/disable",
            [],
            $this->tokenFor($owner)
        )->assertStatus(404);
    }

    /** 12. Non-existent user ID returns 404 */
    public function test_invalid_user_id_returns_404(): void
    {
        [$owner, $tenant] = $this->createOwner();

        $this->postJson(
            '/api/users/999999/disable',
            [],
            $this->tokenFor($owner)
        )->assertStatus(404);
    }
}
