<?php

namespace Tests\Feature\Developer;

use Tests\TestCase;
use App\Models\ApiRequestLog;
use App\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PruneTelemetryCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_telemetry_prune_command_deletes_records_older_than_retention_days(): void
    {
        // Record older than 30 days
        $oldLog = ApiRequestLog::create([
            'method'      => 'GET',
            'endpoint'    => '/api/old-test',
            'status_code' => 200,
            'duration_ms' => 25.0,
            'created_at'  => now()->subDays(35),
        ]);

        // Record within retention period
        $recentLog = ApiRequestLog::create([
            'method'      => 'POST',
            'endpoint'    => '/api/recent-test',
            'status_code' => 201,
            'duration_ms' => 45.0,
            'created_at'  => now()->subDays(5),
        ]);

        $this->artisan('telemetry:prune', ['--days' => 30])
            ->assertExitCode(0);

        $this->assertDatabaseMissing('api_requests_log', ['id' => $oldLog->id]);
        $this->assertDatabaseHas('api_requests_log', ['id' => $recentLog->id]);

        // Verifies audit log was recorded
        $this->assertDatabaseHas('activity_logs', [
            'event'    => 'telemetry.pruned',
            'severity' => 'info',
        ]);
    }

    public function test_telemetry_prune_rejects_non_positive_days(): void
    {
        $this->artisan('telemetry:prune', ['--days' => 0])
            ->assertExitCode(1);
    }
}
