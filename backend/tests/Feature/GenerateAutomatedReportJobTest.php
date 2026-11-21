<?php

namespace Tests\Feature;

use App\Jobs\GenerateAutomatedReportJob;
use App\Models\GeneratedReport;
use App\Models\ReportPreference;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ReportService;
use App\Mail\AutomatedReportMailable;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class GenerateAutomatedReportJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_successfully_delivers_and_updates_last_sent_at()
    {
        Mail::fake();
        Log::shouldReceive('info')->once();
        
        $tenant = Tenant::create(['name' => 'Test Tenant', 'email' => 'tenant@example.com']);
        app()->instance('current_tenant', $tenant);

        $preference = ReportPreference::create([
            'tenant_id' => $tenant->id,
            'report_type' => 'daily_sales',
            'frequency' => 'daily',
            'delivery_method' => 'dashboard',
            'is_enabled' => true,
        ]);

        $job = new GenerateAutomatedReportJob($preference->id);
        $job->handle(new ReportService(), new \App\Services\ReportDeliveryService());

        $this->assertDatabaseHas('generated_reports', [
            'tenant_id' => $tenant->id,
            'report_type' => 'daily_sales',
        ]);
        
        $preference->refresh();
        $this->assertNotNull($preference->last_sent_at);
        $this->assertFalse(app()->bound('current_tenant'), 'Tenant context should be cleared');
    }

    public function test_job_does_not_update_last_sent_at_on_failure()
    {
        // Force a failure by providing an invalid report type that causes generateReportData to throw
        $tenant = Tenant::create(['name' => 'Test Tenant', 'email' => 'failure@example.com']);
        app()->instance('current_tenant', $tenant);

        $preference = ReportPreference::create([
            'tenant_id' => $tenant->id,
            'report_type' => 'invalid_type', // This will trigger Exception
            'frequency' => 'daily',
            'delivery_method' => 'dashboard',
            'is_enabled' => true,
        ]);

        $job = new GenerateAutomatedReportJob($preference->id);

        try {
            $job->handle(new ReportService(), new \App\Services\ReportDeliveryService());
        } catch (\Exception $e) {
            // Expected
        }

        $preference->refresh();
        $this->assertNull($preference->last_sent_at);
        $this->assertFalse(app()->bound('current_tenant'), 'Tenant context should be cleared even on failure');
    }

    protected function createOwnerForTenant(Tenant $tenant, string $name, string $email): User
    {
        $role = Role::firstOrCreate(
            ['name' => 'owner'],
            ['description' => 'Owner', 'is_default' => true]
        );
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $name,
            'email' => $email,
            'password' => bcrypt('secret123'),
        ]);
        $user->roles()->attach($role->id);
        return $user->fresh('roles');
    }

    public function test_loop_interval_generates_and_saves_report_to_db_and_advances_next_run_at()
    {
        Queue::fake();
        Mail::fake();
        Log::shouldReceive('info')->atLeast()->once();

        Carbon::setTestNow(Carbon::parse('2026-11-20 12:00:00', 'UTC'));
        try {
            $tenant = Tenant::create(['name' => 'Loop Tenant', 'email' => 'loop@example.com']);
            app()->instance('current_tenant', $tenant);
            $user = $this->createOwnerForTenant($tenant, 'Loop Owner', 'loopowner@example.com');

            $storeRes = $this->actingAs($user)->postJson('/api/report-preferences', [
                'report_type' => 'daily_sales',
                'frequency' => 'custom_minutes',
                'interval_minutes' => 2,
                'is_enabled' => true,
                'delivery_method' => 'dashboard',
            ]);
            $this->assertTrue(in_array($storeRes->getStatusCode(), [200, 201], true));
            $prefData = $storeRes->json('data');
            $this->assertEquals(2, $prefData['interval_minutes']);
            $this->assertEquals(
                '2026-11-20T12:02:00+00:00',
                Carbon::parse($prefData['next_run_at'])->utc()->toIso8601String()
            );

            // Not yet due at 12:01:00
            Carbon::setTestNow(Carbon::parse('2026-11-20 12:01:00', 'UTC'));
            $earlyRes = $this->actingAs($user)->postJson('/api/report-preferences/check-due');
            $earlyRes->assertStatus(200);
            $this->assertCount(0, $earlyRes->json('generated'));
            $this->assertEquals(0, GeneratedReport::where('tenant_id', $tenant->id)->count());

            // Due at 12:02:00
            Carbon::setTestNow(Carbon::parse('2026-11-20 12:02:00', 'UTC'));
            $dueRes = $this->actingAs($user)->postJson('/api/report-preferences/check-due');
            $dueRes->assertStatus(200);
            $this->assertCount(1, $dueRes->json('generated'));
            $this->assertEquals(1, GeneratedReport::where('tenant_id', $tenant->id)->count());

            $pref = ReportPreference::find($prefData['id']);
            $this->assertTrue((bool) $pref->is_enabled);
            $this->assertEquals(
                '2026-11-20T12:04:00+00:00',
                Carbon::parse($pref->next_run_at)->utc()->toIso8601String()
            );
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_scheduled_once_near_future_generates_once_saves_to_db_and_disables_schedule()
    {
        Queue::fake();
        Mail::fake();
        Log::shouldReceive('info')->atLeast()->once();

        Carbon::setTestNow(Carbon::parse('2026-11-20 12:00:00', 'UTC'));
        try {
            $tenant = Tenant::create(['name' => 'Once Tenant', 'email' => 'once@example.com']);
            app()->instance('current_tenant', $tenant);
            $user = $this->createOwnerForTenant($tenant, 'Once Owner', 'onceowner@example.com');

            // Past target must be rejected with 422
            $pastRes = $this->actingAs($user)->postJson('/api/report-preferences', [
                'report_type' => 'daily_sales',
                'frequency' => 'scheduled_once',
                'scheduled_at' => '2026-11-20T11:55:00Z',
                'is_enabled' => true,
                'delivery_method' => 'dashboard',
            ]);
            $pastRes->assertStatus(422);

            // Future target in UTC+3 (15:05+03:00 === 12:05 UTC)
            $futureRes = $this->actingAs($user)->postJson('/api/report-preferences', [
                'report_type' => 'daily_sales',
                'frequency' => 'scheduled_once',
                'scheduled_at' => '2026-11-20T15:05:00+03:00',
                'timezone_offset' => -180,
                'is_enabled' => true,
                'delivery_method' => 'dashboard',
            ]);
            $this->assertTrue(in_array($futureRes->getStatusCode(), [200, 201], true));
            $prefData = $futureRes->json('data');
            $this->assertEquals(
                '2026-11-20T12:05:00+00:00',
                Carbon::parse($prefData['next_run_at'])->utc()->toIso8601String()
            );

            // Reached 12:05 UTC -> generates report, saves to DB, disables schedule
            Carbon::setTestNow(Carbon::parse('2026-11-20 12:05:00', 'UTC'));
            $dueRes = $this->actingAs($user)->postJson('/api/report-preferences/check-due');
            $dueRes->assertStatus(200);
            $this->assertCount(1, $dueRes->json('generated'));
            $this->assertDatabaseHas('generated_reports', [
                'tenant_id' => $tenant->id,
                'report_type' => 'daily_sales',
            ]);

            $pref = ReportPreference::find($prefData['id']);
            $this->assertFalse((bool) $pref->is_enabled);
            $this->assertNull($pref->next_run_at);

            // Subsequent check-due must not re-run the completed one-time schedule
            Carbon::setTestNow(Carbon::parse('2026-11-20 12:06:00', 'UTC'));
            $repeatRes = $this->actingAs($user)->postJson('/api/report-preferences/check-due');
            $repeatRes->assertStatus(200);
            $this->assertCount(0, $repeatRes->json('generated'));
            $this->assertEquals(1, GeneratedReport::where('tenant_id', $tenant->id)->count());
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_daily_schedule_uses_timezone_offset_and_advances_one_day()
    {
        Queue::fake();
        Mail::fake();
        Log::shouldReceive('info')->atLeast()->once();

        // 14:30 UTC === 17:30 UTC+3
        Carbon::setTestNow(Carbon::parse('2026-11-20 14:30:00', 'UTC'));
        try {
            $tenant = Tenant::create(['name' => 'Daily TZ Tenant', 'email' => 'dailytz@example.com']);
            app()->instance('current_tenant', $tenant);
            $user = $this->createOwnerForTenant($tenant, 'TZ Owner', 'tzowner@example.com');

            $storeRes = $this->actingAs($user)->postJson('/api/report-preferences', [
                'report_type' => 'daily_sales',
                'frequency' => 'daily',
                'time_of_day' => '18:00',
                'timezone_offset' => -180,
                'is_enabled' => true,
                'delivery_method' => 'dashboard',
            ]);
            $this->assertTrue(in_array($storeRes->getStatusCode(), [200, 201], true));
            $prefData = $storeRes->json('data');

            // 18:00 UTC+3 === 15:00 UTC same day
            $this->assertEquals(
                '2026-11-20T15:00:00+00:00',
                Carbon::parse($prefData['next_run_at'])->utc()->toIso8601String()
            );

            Carbon::setTestNow(Carbon::parse('2026-11-20 15:00:00', 'UTC'));
            $dueRes = $this->actingAs($user)->postJson('/api/report-preferences/check-due');
            $dueRes->assertStatus(200);
            $this->assertCount(1, $dueRes->json('generated'));

            $pref = ReportPreference::find($prefData['id']);
            $this->assertEquals(
                '2026-11-21T15:00:00+00:00',
                Carbon::parse($pref->next_run_at)->utc()->toIso8601String()
            );
        } finally {
            Carbon::setTestNow();
        }
    }
}
