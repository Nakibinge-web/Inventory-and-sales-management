<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\ApiRequestLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class DeveloperTelemetryApiTest extends TestCase
{
    use RefreshDatabase;

    private function createDeveloperUser(array $permissions = ['developer.portal.access', 'developer.telemetry.view']): User
    {
        $tenant = Tenant::factory()->create();
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
        $this->getJson('/api/developer/requests')->assertStatus(401);
        $this->getJson('/api/developer/requests/1')->assertStatus(401);
    }

    public function test_user_without_telemetry_permission_is_denied(): void
    {
        // Has portal access, but lacks telemetry.view
        $user = $this->createDeveloperUser(['developer.portal.access']);
        Sanctum::actingAs($user);

        $this->getJson('/api/developer/requests')->assertStatus(403);
        $this->getJson('/api/developer/requests/1')->assertStatus(403);
    }

    public function test_authorized_developer_can_list_telemetry_with_cross_tenant_records(): void
    {
        $tenantA = Tenant::factory()->create(['name' => 'Tenant Alpha']);
        $tenantB = Tenant::factory()->create(['name' => 'Tenant Beta']);

        ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/products',
            'status_code' => 200,
            'duration_ms' => 45.5,
            'tenant_id'   => $tenantA->id,
            'created_at'  => now(),
        ]);

        ApiRequestLog::create([
            'method'      => 'POST',
            'endpoint'    => '/api/sales',
            'status_code' => 201,
            'duration_ms' => 120.0,
            'tenant_id'   => $tenantB->id,
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/requests');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_filters_by_status_category_and_method(): void
    {
        ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/products',
            'status_code' => 200,
            'duration_ms' => 50,
            'created_at'  => now(),
        ]);

        ApiRequestLog::create([
            'method'      => 'POST',
            'endpoint'    => '/api/sales',
            'status_code' => 422,
            'duration_ms' => 80,
            'created_at'  => now(),
        ]);

        ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/reports',
            'status_code' => 500,
            'duration_ms' => 750,
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Status 4xx filter
        $res4xx = $this->getJson('/api/developer/requests?status=4xx');
        $res4xx->assertStatus(200);
        $this->assertCount(1, $res4xx->json('data'));
        $this->assertEquals(422, $res4xx->json('data.0.status_code'));

        // Method filter
        $resMethod = $this->getJson('/api/developer/requests?method=POST');
        $resMethod->assertStatus(200);
        $this->assertCount(1, $resMethod->json('data'));
        $this->assertEquals('POST', $resMethod->json('data.0.method'));

        // Slow requests filter (>500ms)
        $resSlow = $this->getJson('/api/developer/requests?slow_only=1');
        $resSlow->assertStatus(200);
        $this->assertCount(1, $resSlow->json('data'));
        $this->assertEquals(750, $resSlow->json('data.0.duration_ms'));
    }

    public function test_show_endpoint_returns_single_record_or_404(): void
    {
        $log = ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/customers',
            'status_code' => 200,
            'duration_ms' => 60,
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $resFound = $this->getJson("/api/developer/requests/{$log->id}");
        $resFound->assertStatus(200);
        $resFound->assertJson(['success' => true, 'data' => ['id' => $log->id, 'endpoint' => '/api/customers']]);

        $resMissing = $this->getJson('/api/developer/requests/999999');
        $resMissing->assertStatus(404);
        $resMissing->assertJson(['success' => false, 'message' => 'Telemetry record not found.']);
    }

    public function test_validation_rejects_invalid_inputs(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // per_page > 100
        $this->getJson('/api/developer/requests?per_page=500')->assertStatus(422);

        // per_page < 1
        $this->getJson('/api/developer/requests?per_page=0')->assertStatus(422);

        // invalid date
        $this->getJson('/api/developer/requests?date_from=not-a-date')->assertStatus(422);
    }

    public function test_filters_by_endpoint_search_tenant_and_date_range(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/v1/billing/invoices',
            'status_code' => 200,
            'duration_ms' => 30,
            'tenant_id'   => $tenantA->id,
            'created_at'  => now()->subDays(2),
        ]);

        ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/v1/users/profile',
            'status_code' => 200,
            'duration_ms' => 20,
            'tenant_id'   => $tenantB->id,
            'created_at'  => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        // Search by endpoint keyword
        $resSearch = $this->getJson('/api/developer/requests?search=billing');
        $resSearch->assertStatus(200);
        $this->assertCount(1, $resSearch->json('data'));
        $this->assertEquals('/api/v1/billing/invoices', $resSearch->json('data.0.endpoint'));

        // Filter by tenant ID
        $resTenant = $this->getJson("/api/developer/requests?tenant_id={$tenantB->id}");
        $resTenant->assertStatus(200);
        $this->assertCount(1, $resTenant->json('data'));
        $this->assertEquals('/api/v1/users/profile', $resTenant->json('data.0.endpoint'));

        // Filter by date range
        $resDate = $this->getJson('/api/developer/requests?date_from=' . now()->subDays(3)->toDateString() . '&date_to=' . now()->subDay()->toDateString());
        $resDate->assertStatus(200);
        $this->assertCount(1, $resDate->json('data'));
        $this->assertEquals('/api/v1/billing/invoices', $resDate->json('data.0.endpoint'));
    }

    public function test_empty_results_returns_empty_array_with_pagination(): void
    {
        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson('/api/developer/requests?search=nonexistent-endpoint');
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

    public function test_telemetry_captures_and_sanitizes_sensitive_error_details(): void
    {
        // Simulate a request where the error contains sensitive tokens and passwords
        $log = ApiRequestLog::create([
            'method'         => 'POST',
            'endpoint'       => '/api/auth/login',
            'status_code'    => 401,
            'duration_ms'    => 35,
            'error_type'     => 'AuthenticationException',
            'error_message'  => 'Invalid token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and password=SuperSecret123!',
            'created_at'     => now(),
        ]);

        $dev = $this->createDeveloperUser();
        Sanctum::actingAs($dev);

        $response = $this->getJson("/api/developer/requests/{$log->id}");
        $response->assertStatus(200);

        // Ensure record is retrievable
        $this->assertEquals($log->id, $response->json('data.id'));

        // Now test via middleware that the sanitization prevents unredacted secrets from reaching storage
        $middleware = new \App\Http\Middleware\LogApiRequests();
        $reflector = new \ReflectionClass($middleware);
        $method = $reflector->getMethod('sanitizeErrorMessage');
        $method->setAccessible(true);

        $sanitized = $method->invoke($middleware, 'Failed with Bearer eyJ123456 and password=SecretPassword123 & token=abcxyz');
        $this->assertStringNotContainsString('eyJ123456', $sanitized);
        $this->assertStringNotContainsString('SecretPassword123', $sanitized);
        $this->assertStringNotContainsString('abcxyz', $sanitized);
        $this->assertStringContainsString('Bearer [REDACTED]', $sanitized);
        $this->assertStringContainsString('password=[REDACTED]', $sanitized);
        $this->assertStringContainsString('token=[REDACTED]', $sanitized);
    }
}
