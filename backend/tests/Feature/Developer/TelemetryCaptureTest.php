<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\ApiRequestLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class TelemetryCaptureTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_requests_are_logged_to_telemetry_table(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/categories');
        $response->assertStatus(200);

        $this->assertDatabaseHas('api_requests_log', [
            'method'      => 'GET',
            'endpoint'    => '/api/categories',
            'status_code' => 200,
            'user_id'     => $user->id,
            'tenant_id'   => $tenant->id,
        ]);
    }

    public function test_excluded_noisy_routes_are_not_logged(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        Sanctum::actingAs($user);

        $this->getJson('/api/health');

        $this->assertDatabaseMissing('api_requests_log', [
            'endpoint' => '/api/health',
        ]);
    }

    public function test_error_requests_capture_error_classification(): void
    {
        $response = $this->getJson('/api/developer/ping');
        $response->assertStatus(401);

        $this->assertDatabaseHas('api_requests_log', [
            'method'      => 'GET',
            'endpoint'    => '/api/developer/ping',
            'status_code' => 401,
            'error_type'  => 'ClientError',
        ]);
    }
}
