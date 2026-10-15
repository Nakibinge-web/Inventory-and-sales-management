<?php

namespace Tests\Feature;

use App\Models\GeneratedReport;
use App\Models\ReportPreference;
use App\Models\Tenant;
use App\Services\ReportDeliveryService;
use App\Mail\AutomatedReportMailable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ReportDeliveryServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_delivery_creates_generated_report()
    {
        Mail::fake();
        $tenant = Tenant::create(['name' => 'Test Tenant']);
        app()->instance('current_tenant', $tenant);

        $preference = ReportPreference::create([
            'tenant_id' => $tenant->id,
            'report_type' => 'daily_sales',
            'delivery_method' => 'dashboard',
            'is_enabled' => true,
        ]);

        $data = ['total_sales' => 1000];
        $service = new ReportDeliveryService();
        $service->deliver($preference, $data, '2026-08-01', '2026-08-01');

        $this->assertDatabaseHas('generated_reports', [
            'tenant_id' => $tenant->id,
            'report_type' => 'daily_sales',
        ]);
        
        $report = GeneratedReport::first();
        $this->assertEquals($data, $report->data);
    }

    public function test_email_delivery_constructs_mailable()
    {
        Mail::fake();
        $tenant = Tenant::create(['name' => 'Test Tenant']);
        app()->instance('current_tenant', $tenant);

        $preference = ReportPreference::create([
            'tenant_id' => $tenant->id,
            'report_type' => 'daily_sales',
            'delivery_method' => 'email',
            'recipient_email' => 'test@example.com',
            'is_enabled' => true,
        ]);

        $data = ['total_sales' => 1000];
        $service = new ReportDeliveryService();
        $service->deliver($preference, $data, '2026-08-01', '2026-08-01');

        Mail::assertSent(AutomatedReportMailable::class, function ($mail) use ($preference) {
            return $mail->hasTo($preference->recipient_email);
        });
    }
}
