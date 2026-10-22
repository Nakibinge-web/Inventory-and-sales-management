<?php

namespace Tests\Feature;

use App\Models\GeneratedReport;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::create([
            'name' => 'Test Business',
            'email' => 'test@business.com',
        ]);

        app()->instance('current_tenant', $this->tenant);

        // Create owner role (as a default role without tenant_id to match existing system)
        $ownerRole = Role::create(['name' => 'owner']);
        
        // Create permission for reports (as default permission)
        $permission = Permission::create(['name' => 'reports.view']);
        
        // Attach permission to owner role
        $ownerRole->permissions()->attach($permission);
        
        $this->user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $this->user->roles()->attach($ownerRole);
    }

    public function test_can_list_generated_reports()
    {
        GeneratedReport::create([
            'tenant_id' => $this->tenant->id,
            'report_type' => 'daily_sales',
            'generated_at' => now(),
            'data' => ['total_sales' => 1000],
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->getJson('/api/reports/generated');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'report_type',
                        'generated_at',
                        'export_urls' => ['pdf', 'docx'],
                    ],
                ],
            ]);
    }

    public function test_can_export_generated_report_as_pdf()
    {
        $report = GeneratedReport::create([
            'tenant_id' => $this->tenant->id,
            'report_type' => 'daily_sales',
            'generated_at' => now(),
            'data' => [
                'date' => '2026-10-21',
                'total_sales' => 1000,
                'total_profit' => 200,
                'total_transactions' => 5,
            ],
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->get("/api/reports/generated/{$report->id}/export?format=pdf");

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_can_export_generated_report_as_docx()
    {
        $report = GeneratedReport::create([
            'tenant_id' => $this->tenant->id,
            'report_type' => 'monthly_sales',
            'generated_at' => now(),
            'data' => [
                'month' => '2026-10',
                'total_sales' => 5000,
                'total_profit' => 1000,
                'total_transactions' => 25,
            ],
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->get("/api/reports/generated/{$report->id}/export?format=docx");

        $response->assertStatus(200);
        $this->assertEquals(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $response->headers->get('content-type')
        );
    }

    public function test_can_export_daily_sales_report_on_demand()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/sales/export', [
                'report_type' => 'daily',
                'format' => 'pdf',
                'date' => '2026-10-21',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_can_export_monthly_sales_report_on_demand()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/sales/export', [
                'report_type' => 'monthly',
                'format' => 'docx',
                'month' => '2026-10',
            ]);

        $response->assertStatus(200);
        $this->assertEquals(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $response->headers->get('content-type')
        );
    }

    public function test_can_export_yearly_sales_report_on_demand()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/sales/export', [
                'report_type' => 'yearly',
                'format' => 'pdf',
                'year' => 2026,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_can_export_purchases_report_on_demand()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/purchases/export', [
                'report_type' => 'daily',
                'format' => 'pdf',
                'date' => '2026-10-21',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_can_export_overview_report_on_demand_as_pdf()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/overview/export', [
            'format' => 'pdf',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('content-type'));
    }

    public function test_can_export_overview_report_on_demand_as_docx()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/overview/export', [
            'format' => 'docx',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $response->headers->get('content-type')
        );
    }

    public function test_validates_format_parameter()
    {
        $report = GeneratedReport::create([
            'tenant_id' => $this->tenant->id,
            'report_type' => 'daily_sales',
            'generated_at' => now(),
            'data' => ['total_sales' => 1000],
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->getJson("/api/reports/generated/{$report->id}/export?format=invalid");

        $response->assertStatus(422);
    }

    public function test_validates_report_type_parameter()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);
        $response = $this->postJson('/api/reports/sales/export', [
                'report_type' => 'invalid',
                'format' => 'pdf',
                'date' => '2026-10-21',
            ]);

        $response->assertStatus(422);
    }

    public function test_requires_authentication()
    {
        $response = $this->getJson('/api/reports/generated');

        $response->assertStatus(401);
    }

    public function test_requires_permission()
    {
        // Create user without reports permission
        $userWithoutPermission = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'No Permission User',
            'email' => 'noperm@example.com',
            'password' => bcrypt('password'),
            'is_active' => true,
        ]);

        $cashierRole = Role::create(['name' => 'cashier']);
        $userWithoutPermission->roles()->attach($cashierRole);

        \Laravel\Sanctum\Sanctum::actingAs($userWithoutPermission);
        $response = $this->getJson('/api/reports/generated');

        $response->assertStatus(403);
    }
}
