<?php

namespace Tests\Feature;

use App\Jobs\GenerateAutomatedReportJob;
use App\Models\GeneratedReport;
use App\Models\ReportPreference;
use App\Models\Tenant;
use App\Services\ReportService;
use App\Mail\AutomatedReportMailable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class GenerateAutomatedReportJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_successfully_delivers_and_updates_last_sent_at()
    {
        Mail::fake();
        Log::shouldReceive('info')->once();
        
        $tenant = Tenant::create(['name' => 'Test Tenant']);
        app()->instance('current_tenant', $tenant);

        $preference = ReportPreference::create([
            'tenant_id' => $tenant->id,
            'report_type' => 'daily_sales',
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
        $this->assertNull(app('current_tenant'), 'Tenant context should be cleared');
    }

    public function test_job_does_not_update_last_sent_at_on_failure()
    {
        // Force a failure by providing an invalid report type that causes generateReportData to throw
        $tenant = Tenant::create(['name' => 'Test Tenant']);
        app()->instance('current_tenant', $tenant);

        $preference = ReportPreference::create([
            'tenant_id' => $tenant->id,
            'report_type' => 'invalid_type', // This will trigger Exception
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
        $this->assertNull(app('current_tenant'), 'Tenant context should be cleared even on failure');
    }
}
