<?php

namespace Tests\Feature;

use App\Jobs\GenerateAutomatedReportJob;
use App\Models\MomoTransaction;
use App\Models\ReportPreference;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ReportDeliveryService;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class SubscriptionExpiryTest extends TestCase
{
    use RefreshDatabase;

    private function createTenantWithOwnerAndStaff(array $tenantOverrides = []): array
    {
        $tenant = Tenant::create(array_merge([
            'name'                    => 'Shop ' . uniqid(),
            'email'                   => 'shop_' . uniqid() . '@example.com',
            'subscription_plan'       => 'starter',
            'subscription_status'     => 'active',
            'subscription_expires_at' => now()->addDays(15),
        ], $tenantOverrides));

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $staffRole = Role::firstOrCreate(
            ['name' => 'cashier', 'tenant_id' => null],
            ['description' => 'Cashier', 'is_default' => true]
        );

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Tenant Owner',
            'email'     => 'owner_' . uniqid() . '@example.com',
            'username'  => 'owner_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $owner->roles()->attach($ownerRole->id);

        $staff = User::create([
            'tenant_id'  => $tenant->id,
            'name'       => 'Cashier User',
            'email'      => 'staff_' . uniqid() . '@example.com',
            'username'   => 'staff_' . uniqid(),
            'password'   => Hash::make('Password1!'),
            'is_active'  => true,
            'created_by' => $owner->id,
        ]);
        $staff->roles()->attach($staffRole->id);

        return [$tenant, $owner, $staff];
    }

    public function test_active_subscription_allows_owner_and_staff_login_and_access(): void
    {
        [$tenant, $owner, $staff] = $this->createTenantWithOwnerAndStaff();

        $ownerLogin = $this->postJson('/api/login', [
            'login'    => $owner->email,
            'password' => 'Password1!',
        ]);
        $ownerLogin->assertStatus(200)->assertJsonStructure(['token']);

        $staffLogin = $this->postJson('/api/login', [
            'login'    => $staff->username,
            'password' => 'Password1!',
        ]);
        $staffLogin->assertStatus(200)->assertJsonStructure(['token']);

        $ownerToken = $ownerLogin->json('token');
        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/products')
            ->assertStatus(200);
    }

    public function test_expired_subscription_blocks_owner_and_created_users_from_logging_in(): void
    {
        [$tenant, $owner, $staff] = $this->createTenantWithOwnerAndStaff([
            'subscription_status'     => 'active',
            'subscription_expires_at' => now()->subMinute(),
        ]);

        // Owner login blocked
        $ownerRes = $this->postJson('/api/login', [
            'login'    => $owner->email,
            'password' => 'Password1!',
        ]);
        $ownerRes->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED')
            ->assertJsonPath('subscription_expired', true)
            ->assertJsonPath('is_owner', true)
            ->assertJsonMissingPath('token');
        $this->assertStringContainsString('subscribe', strtolower($ownerRes->json('message')));
        $this->assertNotEmpty($ownerRes->json('renewal_token'));

        // User created by that tenant also blocked
        $staffRes = $this->postJson('/api/login', [
            'login'    => $staff->username,
            'password' => 'Password1!',
        ]);
        $staffRes->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED')
            ->assertJsonPath('subscription_expired', true)
            ->assertJsonPath('is_owner', false)
            ->assertJsonMissingPath('token');
        $this->assertStringContainsString('subscribe', strtolower($staffRes->json('message')));
    }

    public function test_expired_subscription_blocks_existing_tokens_for_owner_and_all_tenant_users(): void
    {
        [$tenant, $owner, $staff] = $this->createTenantWithOwnerAndStaff();

        $ownerToken = $owner->createToken('owner-session')->plainTextToken;
        $staffToken = $staff->createToken('staff-session')->plainTextToken;

        // Works before expiry
        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/users/me')
            ->assertStatus(200);

        // Subscription period ends (even while status column was 'trial' or 'active')
        $tenant->update([
            'subscription_status'     => 'trial',
            'subscription_expires_at' => now()->subSecond(),
        ]);

        // Owner token is now rejected across application routes
        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/users/me')
            ->assertStatus(403)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED')
            ->assertJsonPath('subscription_expired', true);

        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/products')
            ->assertStatus(403)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED');

        $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->getJson('/api/settings/business')
            ->assertStatus(403)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED');

        // Created user token is also rejected across application routes
        $this->withHeader('Authorization', 'Bearer ' . $staffToken)
            ->getJson('/api/users/me')
            ->assertStatus(403)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED')
            ->assertJsonPath('subscription_expired', true);

        $this->withHeader('Authorization', 'Bearer ' . $staffToken)
            ->postJson('/api/sales', [])
            ->assertStatus(403)
            ->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED');

        // Logout remains allowed so expired sessions can sign out cleanly
        $this->withHeader('Authorization', 'Bearer ' . $staffToken)
            ->postJson('/api/logout')
            ->assertStatus(200);
    }

    public function test_explicit_expired_status_blocks_even_without_expiry_timestamp(): void
    {
        [$tenant, $owner, $staff] = $this->createTenantWithOwnerAndStaff([
            'subscription_status'     => 'expired',
            'subscription_expires_at' => null,
        ]);

        $this->postJson('/api/login', [
            'login'    => $owner->email,
            'password' => 'Password1!',
        ])->assertStatus(403)->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED');

        $this->postJson('/api/login', [
            'login'    => $staff->email,
            'password' => 'Password1!',
        ])->assertStatus(403)->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED');
    }

    public function test_expiring_one_tenant_does_not_affect_other_active_tenants(): void
    {
        [$expiredTenant, $expiredOwner] = $this->createTenantWithOwnerAndStaff([
            'subscription_expires_at' => now()->subDay(),
        ]);
        [$activeTenant, $activeOwner, $activeStaff] = $this->createTenantWithOwnerAndStaff([
            'subscription_expires_at' => now()->addDays(10),
        ]);

        $this->postJson('/api/login', [
            'login'    => $expiredOwner->email,
            'password' => 'Password1!',
        ])->assertStatus(403)->assertJsonPath('code', 'SUBSCRIPTION_EXPIRED');

        $this->postJson('/api/login', [
            'login'    => $activeStaff->email,
            'password' => 'Password1!',
        ])->assertStatus(200)->assertJsonStructure(['token']);
    }

    public function test_resubscribing_via_nexumpay_with_renewal_token_restores_access(): void
    {
        config([
            'nexumpay.wallet_address'  => '',
            'nexumpay.auth_token'      => '',
            'nexumpay.username'        => '',
            'nexumpay.password'        => '',
            'nexumpay.simulation_mode' => true,
        ]);

        [$tenant, $owner, $staff] = $this->createTenantWithOwnerAndStaff([
            'subscription_expires_at' => now()->subDay(),
        ]);

        $loginRes = $this->postJson('/api/login', [
            'login'    => $owner->email,
            'password' => 'Password1!',
        ])->assertStatus(403);

        $renewalToken = $loginRes->json('renewal_token');
        $this->assertNotEmpty($renewalToken);

        $initRes = $this->postJson('/api/nexumpay/initiate', [
            'phone'          => '0772123456',
            'plan_id'        => 'starter',
            'billing_cycle'  => 'monthly',
            'customer_name'  => $owner->name,
            'customer_email' => 'different-receipt-email@example.com',
            'business_name'  => $tenant->name,
            'renewal_token'  => $renewalToken,
        ])->assertStatus(200);

        $ref = $initRes->json('client_ref');

        $this->postJson("/api/nexumpay/simulate/{$ref}", ['action' => 'SUCCESS'])
            ->assertStatus(200)
            ->assertJsonPath('status', 'SUCCESSFUL')
            ->assertJsonPath('transaction.tenant_subscription.is_subscription_expired', false);

        // Both owner and created user can now log in again
        $this->postJson('/api/login', [
            'login'    => $owner->email,
            'password' => 'Password1!',
        ])->assertStatus(200)->assertJsonStructure(['token']);

        $this->postJson('/api/login', [
            'login'    => $staff->username,
            'password' => 'Password1!',
        ])->assertStatus(200)->assertJsonStructure(['token']);
    }

    public function test_automated_report_job_skips_expired_tenant(): void
    {
        Mail::fake();
        [$tenant] = $this->createTenantWithOwnerAndStaff([
            'subscription_expires_at' => now()->subHour(),
        ]);

        $preference = ReportPreference::create([
            'tenant_id'       => $tenant->id,
            'report_type'     => 'daily_sales',
            'frequency'       => 'daily',
            'delivery_method' => 'dashboard',
            'is_enabled'      => true,
        ]);

        $job = new GenerateAutomatedReportJob($preference->id);
        $job->handle(new ReportService(), new ReportDeliveryService());

        $this->assertDatabaseCount('generated_reports', 0);
    }

    public function test_subscribing_again_on_same_package_adds_30_days_to_remaining_20_days(): void
    {
        config([
            'nexumpay.wallet_address'  => '',
            'nexumpay.auth_token'      => '',
            'nexumpay.username'        => '',
            'nexumpay.password'        => '',
            'nexumpay.simulation_mode' => true,
        ]);

        $initialExpiry = now()->addDays(20);

        [$tenant, $owner] = $this->createTenantWithOwnerAndStaff([
            'subscription_plan'       => 'starter',
            'subscription_status'     => 'active',
            'subscription_expires_at' => $initialExpiry,
        ]);

        $this->assertSame(20, $tenant->remainingSubscriptionDays());

        $ownerToken = $owner->createToken('owner-session')->plainTextToken;

        $initRes = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->postJson('/api/nexumpay/initiate', [
                'phone'          => '0772123456',
                'plan_id'        => 'starter',
                'billing_cycle'  => 'monthly',
                'customer_name'  => $owner->name,
                'customer_email' => $tenant->email,
                'business_name'  => $tenant->name,
            ])->assertStatus(200);

        $ref = $initRes->json('client_ref');

        $simRes = $this->postJson("/api/nexumpay/simulate/{$ref}", ['action' => 'SUCCESS'])
            ->assertStatus(200)
            ->assertJsonPath('status', 'SUCCESSFUL')
            ->assertJsonPath('transaction.tenant_subscription.subscription_plan', 'starter')
            ->assertJsonPath('transaction.tenant_subscription.remaining_days', 50);

        $tenant->refresh();
        $this->assertSame(50, $tenant->remainingSubscriptionDays());
        $this->assertSame(
            $initialExpiry->copy()->addDays(30)->toDateTimeString(),
            $tenant->subscription_expires_at->toDateTimeString()
        );

        // Duplicate webhook delivery & subsequent status poll must NOT double-add days
        $this->postJson('/api/nexumpay/webhook', [
            'client_ref' => $ref,
            'status'     => 'SUCCESS',
        ])->assertStatus(200);

        $this->getJson("/api/nexumpay/status/{$ref}")
            ->assertStatus(200)
            ->assertJsonPath('transaction.tenant_subscription.remaining_days', 50);

        $tenant->refresh();
        $this->assertSame(50, $tenant->remainingSubscriptionDays());
        $this->assertNotNull($simRes->json('transaction.tenant_subscription.subscription_expires_at'));
    }

    public function test_annual_extension_and_plan_change_duration_rules(): void
    {
        config([
            'nexumpay.wallet_address'  => '',
            'nexumpay.auth_token'      => '',
            'nexumpay.username'        => '',
            'nexumpay.password'        => '',
            'nexumpay.simulation_mode' => true,
        ]);

        // Same active package + annual adds 365 days on top of 20 remaining days = 385 days
        $initialExpiry = now()->addDays(20);
        [$starterTenant, $starterOwner] = $this->createTenantWithOwnerAndStaff([
            'subscription_plan'       => 'starter',
            'subscription_status'     => 'active',
            'subscription_expires_at' => $initialExpiry,
        ]);

        $starterToken = $starterOwner->createToken('owner-session')->plainTextToken;
        $annualInit = $this->withHeader('Authorization', 'Bearer ' . $starterToken)
            ->postJson('/api/nexumpay/initiate', [
                'phone'          => '0772123456',
                'plan_id'        => 'starter',
                'billing_cycle'  => 'annual',
                'customer_name'  => $starterOwner->name,
                'customer_email' => $starterTenant->email,
                'business_name'  => $starterTenant->name,
            ])->assertStatus(200);

        $this->postJson('/api/nexumpay/simulate/' . $annualInit->json('client_ref'), ['action' => 'SUCCESS'])
            ->assertStatus(200)
            ->assertJsonPath('transaction.tenant_subscription.remaining_days', 385);

        // Switching from starter (20d left) to business monthly starts fresh 30-day cycle
        [$switchTenant, $switchOwner] = $this->createTenantWithOwnerAndStaff([
            'subscription_plan'       => 'starter',
            'subscription_status'     => 'active',
            'subscription_expires_at' => now()->addDays(20),
        ]);

        $switchToken = $switchOwner->createToken('switch-session')->plainTextToken;
        $switchInit = $this->withHeader('Authorization', 'Bearer ' . $switchToken)
            ->postJson('/api/nexumpay/initiate', [
                'phone'          => '0772123456',
                'plan_id'        => 'business',
                'billing_cycle'  => 'monthly',
                'customer_name'  => $switchOwner->name,
                'customer_email' => $switchTenant->email,
                'business_name'  => $switchTenant->name,
            ])->assertStatus(200);

        $this->postJson('/api/nexumpay/simulate/' . $switchInit->json('client_ref'), ['action' => 'SUCCESS'])
            ->assertStatus(200)
            ->assertJsonPath('transaction.tenant_subscription.subscription_plan', 'business')
            ->assertJsonPath('transaction.tenant_subscription.remaining_days', 30);
    }

    public function test_momo_webhook_renewal_extends_same_package_once(): void
    {
        $initialExpiry = now()->addDays(20);
        [$tenant, $owner] = $this->createTenantWithOwnerAndStaff([
            'subscription_plan'       => 'starter',
            'subscription_status'     => 'active',
            'subscription_expires_at' => $initialExpiry,
        ]);

        $refId = (string) Str::uuid();
        MomoTransaction::create([
            'reference_id'   => $refId,
            'external_id'    => 'MOMO-' . uniqid(),
            'tenant_id'      => $tenant->id,
            'user_id'        => $owner->id,
            'customer_name'  => $owner->name,
            'customer_email' => $tenant->email,
            'customer_phone' => '256772123456',
            'plan_id'        => 'starter',
            'plan_name'      => 'Starter Plan',
            'billing_cycle'  => 'monthly',
            'amount'         => 1000,
            'currency'       => 'UGX',
            'status'         => 'PENDING',
        ]);

        $this->postJson('/api/momo/webhook', [
            'referenceId' => $refId,
            'status'      => 'SUCCESSFUL',
        ])->assertStatus(200);

        $tenant->refresh();
        $this->assertSame(50, $tenant->remainingSubscriptionDays());

        // Duplicate webhook call does not stack another 30 days
        $this->postJson('/api/momo/webhook', [
            'referenceId' => $refId,
            'status'      => 'SUCCESSFUL',
        ])->assertStatus(200);

        $tenant->refresh();
        $this->assertSame(50, $tenant->remainingSubscriptionDays());
    }
}
