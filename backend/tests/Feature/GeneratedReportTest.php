<?php

namespace Tests\Feature;

use App\Models\GeneratedReport;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GeneratedReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_generated_report_persistence_and_isolation()
    {
        // Setup tenants
        $tenantA = Tenant::create(['name' => 'Tenant A']);
        $tenantB = Tenant::create(['name' => 'Tenant B']);

        // Setup tenant context A
        app()->instance('current_tenant', $tenantA);

        $data = ['foo' => 'bar', 'baz' => [1, 2, 3]];
        
        $report = GeneratedReport::create([
            'report_type' => 'daily_sales',
            'generated_at' => now(),
            'data' => $data,
        ]);

        $this->assertEquals($tenantA->id, $report->tenant_id);
        $this->assertEquals($data, $report->data);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $report->generated_at);

        // Verify isolation
        app()->forgetInstance('current_tenant');
        app()->instance('current_tenant', $tenantB);

        $this->assertEquals(0, GeneratedReport::count());
    }
}
