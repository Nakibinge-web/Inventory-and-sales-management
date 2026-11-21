<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class DeveloperActivityApiTest extends TestCase
{
    use RefreshDatabase;

    private function createDeveloperUser(array $permissions = ['developer.portal.access', 'developer.activity.view']): User
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $role = Role::firstOrCreate(
            ['name' => 'custom-act-role', 'tenant_id' => $tenant->id],
            ['description' => 'Test Activity Role', 'is_default' => false]
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
        $this->getJson('/api/developer/activity')->assertStatus(401);
        $this->getJson('/api/developer/activity/1')->assertStatus(401);
    }

    public function test_user_without_activity_permission_is_denied(): void
    {
        // Has portal access, but lacks activity.view
        $user = $this->createDeveloperUser(['developer.portal.access']);
        Sanctum::actingAs($user);

        $this->getJson('/api/developer/activity')->assertStatus(403);
        $this->getJson('/api/developer/activity/1')->assertStatus(403);
    }

    public function test_authorized_developer_can_list_activity_across_tenants(): void
    {
        $tenant1 = Tenant::factory()->create(['name' => 'Store 1']);
        $tenant2 = Tenant::factory()->create(['name' => 'Store 2']);

        ActivityLog::create([
            'event'       => 'tenant.activated',
            'description' => 'Store 1 activated',
            'severity'    => 'info',
            'tenant_id'   => $tenant1->id,
            'outcome'     => 'success',
            'created_at'  => now(),
        ]);

        ActivityLog::create([
            'event'       => 'subscription.trial_extended',
            'description' => 'Store 2 trial extended',
            'severity'    => 'warning',
            'tenant_id'   => $tenant2->id,
            'outcome'     => 'success',
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/activity');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_activity_filters_by_severity_event_and_search(): void
    {
        ActivityLog::create([
            'event'       => 'user.login_failed',
            'description' => 'Failed login attempt for user root',
            'severity'    => 'warning',
            'outcome'     => 'failure',
            'created_at'  => now(),
        ]);

        ActivityLog::create([
            'event'       => 'tenant.suspended',
            'description' => 'Tenant Zziwa suspended due to non-payment',
            'severity'    => 'critical',
            'outcome'     => 'success',
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Severity filter
        $resCritical = $this->getJson('/api/developer/activity?severity=critical');
        $resCritical->assertStatus(200);
        $this->assertCount(1, $resCritical->json('data'));
        $this->assertEquals('tenant.suspended', $resCritical->json('data.0.event'));

        // Search filter
        $resSearch = $this->getJson('/api/developer/activity?search=Zziwa');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertStringContainsString('Zziwa', $resSearch->json('data.0.description'));
    }

    public function test_activity_show_endpoint(): void
    {
        $log = ActivityLog::create([
            'event'       => 'module.toggled',
            'description' => 'AI module enabled for tenant',
            'severity'    => 'info',
            'outcome'     => 'success',
            'properties'  => ['module' => 'ai', 'enabled' => true],
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $resFound = $this->getJson("/api/developer/activity/{$log->id}");
        $resFound->assertStatus(200);
        $resFound->assertJson(['success' => true, 'data' => ['id' => $log->id, 'event' => 'module.toggled']]);

        $resMissing = $this->getJson('/api/developer/activity/999999');
        $resMissing->assertStatus(404);
        $resMissing->assertJson(['success' => false, 'message' => 'Activity log record not found.']);
    }

    public function test_activity_filters_by_outcome_tenant_and_date_range(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        ActivityLog::create([
            'event'       => 'backup.completed',
            'description' => 'Nightly backup completed',
            'severity'    => 'info',
            'outcome'     => 'success',
            'tenant_id'   => $tenantA->id,
            'created_at'  => now()->subDays(3),
        ]);

        ActivityLog::create([
            'event'       => 'backup.failed',
            'description' => 'Backup storage full',
            'severity'    => 'error',
            'outcome'     => 'failure',
            'tenant_id'   => $tenantB->id,
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Outcome failure filter
        $resFail = $this->getJson('/api/developer/activity?outcome=failure');
        $resFail->assertStatus(200);
        $this->assertCount(1, $resFail->json('data'));
        $this->assertEquals('backup.failed', $resFail->json('data.0.event'));

        // Tenant ID filter
        $resTenant = $this->getJson("/api/developer/activity?tenant_id={$tenantA->id}");
        $resTenant->assertStatus(200);
        $this->assertCount(1, $resTenant->json('data'));
        $this->assertEquals('backup.completed', $resTenant->json('data.0.event'));

        // Date range filter
        $resDate = $this->getJson('/api/developer/activity?date_from=' . now()->subDays(4)->toDateString() . '&date_to=' . now()->subDay()->toDateString());
        $resDate->assertStatus(200);
        $this->assertCount(1, $resDate->json('data'));
        $this->assertEquals('backup.completed', $resDate->json('data.0.event'));
    }

    public function test_activity_validation_rejects_invalid_inputs(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Invalid severity
        $this->getJson('/api/developer/activity?severity=fatal')->assertStatus(422);

        // Invalid outcome
        $this->getJson('/api/developer/activity?outcome=partial')->assertStatus(422);

        // Invalid per_page
        $this->getJson('/api/developer/activity?per_page=999')->assertStatus(422);

        // Invalid date
        $this->getJson('/api/developer/activity?date_from=invalid-date')->assertStatus(422);
    }

    public function test_activity_empty_results_returns_empty_array_with_pagination(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/activity?search=nonexistent_event_query');
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [],
            'pagination' => [
                'current_page' => 1,
                'per_page'     => 25,
                'total'        => 0,
                'last_page'    => 1,
            ],
        ]);
    }

    public function test_activity_redaction_sanitizes_properties_correctly(): void
    {
        $logged = \App\Services\AuditLogService::log(
            'user.password_reset',
            'Password reset performed',
            [
                'severity'   => 'info',
                'properties' => [
                    'password'     => 'PlaintextSecret123',
                    'token'        => 'super-secret-token',
                    'auth_header'  => 'Bearer eyJsecretTokenValue',
                    'safe_field'   => 'normal_value',
                    'nested'       => [
                        'secret_key' => 'nested-secret',
                        'city'       => 'Kampala',
                    ],
                ],
            ]
        );

        $this->assertNotNull($logged);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson("/api/developer/activity/{$logged->id}");
        $response->assertStatus(200);

        $props = $response->json('data.properties');
        $this->assertEquals('[REDACTED]', $props['password']);
        $this->assertEquals('[REDACTED]', $props['token']);
        $this->assertEquals('Bearer [REDACTED]', $props['auth_header']);
        $this->assertEquals('normal_value', $props['safe_field']);
        $this->assertEquals('[REDACTED]', $props['nested']['secret_key']);
        $this->assertEquals('Kampala', $props['nested']['city']);
    }
}
