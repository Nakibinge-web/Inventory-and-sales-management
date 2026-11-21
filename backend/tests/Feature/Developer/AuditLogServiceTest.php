<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuditLogServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_log_persists_event_and_redacts_credentials(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['tenant_id' => $tenant->id]);

        $log = AuditLogService::log('user.password_reset', 'User initiated password reset', [
            'actor_id'    => $user->id,
            'tenant_id'   => $tenant->id,
            'severity'    => 'warning',
            'target_type' => User::class,
            'target_id'   => $user->id,
            'properties'  => [
                'email'                 => 'user@example.com',
                'password'              => 'SuperSecret123!',
                'password_confirmation' => 'SuperSecret123!',
                'token'                 => 'secret_bearer_token',
                'ip'                    => '127.0.0.1',
            ],
        ]);

        $this->assertNotNull($log);
        $this->assertEquals('user.password_reset', $log->event);
        $this->assertEquals('warning', $log->severity);
        $this->assertEquals('user@example.com', $log->properties['email']);
        $this->assertEquals('[REDACTED]', $log->properties['password']);
        $this->assertEquals('[REDACTED]', $log->properties['password_confirmation']);
        $this->assertEquals('[REDACTED]', $log->properties['token']);

        $this->assertDatabaseHas('activity_logs', [
            'id'       => $log->id,
            'event'    => 'user.password_reset',
            'severity' => 'warning',
            'actor_id' => $user->id,
        ]);
    }
}
