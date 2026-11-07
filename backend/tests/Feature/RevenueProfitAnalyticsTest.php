<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RevenueProfitAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $ownerA;
    private User $cashierA;
    private User $reportViewerA;
    private User $ownerB;
    private Product $productA1;
    private Product $productA2;
    private Product $productNoCost;
    private Product $productB1;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = Tenant::create([
            'name'      => 'Tenant A Analytics ' . uniqid(),
            'email'     => 'tenantA_' . uniqid() . '@example.com',
            'is_active' => true,
        ]);

        $this->tenantB = Tenant::create([
            'name'      => 'Tenant B Analytics ' . uniqid(),
            'email'     => 'tenantB_' . uniqid() . '@example.com',
            'is_active' => true,
        ]);

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $cashierRole = Role::firstOrCreate(
            ['name' => 'cashier', 'tenant_id' => null],
            ['description' => 'Cashier', 'is_default' => true]
        );

        $analystRole = Role::firstOrCreate(
            ['name' => 'analyst', 'tenant_id' => null],
            ['description' => 'Report Analyst', 'is_default' => true]
        );

        $salesReportPerm = Permission::firstOrCreate(['name' => 'sales.report']);
        $analystRole->permissions()->syncWithoutDetaching([$salesReportPerm->id]);

        $this->ownerA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Owner A',
            'email'     => 'ownerA_' . uniqid() . '@example.com',
            'username'  => 'ownerA_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->ownerA->roles()->attach($ownerRole->id);

        $this->cashierA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Cashier A',
            'email'     => 'cashierA_' . uniqid() . '@example.com',
            'username'  => 'cashierA_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->cashierA->roles()->attach($cashierRole->id);

        $this->reportViewerA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Analyst A',
            'email'     => 'analystA_' . uniqid() . '@example.com',
            'username'  => 'analystA_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->reportViewerA->roles()->attach($analystRole->id);

        $this->ownerB = User::create([
            'tenant_id' => $this->tenantB->id,
            'name'      => 'Owner B',
            'email'     => 'ownerB_' . uniqid() . '@example.com',
            'username'  => 'ownerB_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->ownerB->roles()->attach($ownerRole->id);

        app()->instance('current_tenant', $this->tenantA);
        $this->productA1 = Product::create([
            'tenant_id'  => $this->tenantA->id,
            'name'       => 'Product A1',
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'stock'      => 100,
        ]);

        $this->productA2 = Product::create([
            'tenant_id'  => $this->tenantA->id,
            'name'       => 'Product A2',
            'price'      => 20000.00,
            'cost_price' => 12000.00,
            'stock'      => 100,
        ]);

        $this->productNoCost = Product::create([
            'tenant_id'  => $this->tenantA->id,
            'name'       => 'Product Without Cost',
            'price'      => 40000.00,
            'cost_price' => null,
            'stock'      => 100,
        ]);

        app()->instance('current_tenant', $this->tenantB);
        $this->productB1 = Product::create([
            'tenant_id'  => $this->tenantB->id,
            'name'       => 'Product B1',
            'price'      => 100000.00,
            'cost_price' => 60000.00,
            'stock'      => 100,
        ]);

        app()->forgetInstance('current_tenant');
    }

    private function tokenFor(User $user): array
    {
        $this->app['auth']->forgetGuards();
        app()->forgetInstance('current_tenant');
        $token = $user->createToken('test-token')->plainTextToken;
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept'        => 'application/json',
        ];
    }

    /** 1 & 2. Revenue calculation excludes tax, subtracts discounts, and returns tax separately */
    public function test_revenue_excludes_tax_subtracts_discounts_and_returns_tax_separately(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Sale 1 on 2026-10-10:
        // Item subtotal = 2 * 50,000 = 100,000
        // Discount = 15,000
        // Tax = 18,000
        // Net Revenue = 100,000 - 15,000 = 85,000
        // Total Collected = 85,000 + 18,000 = 103,000
        // COGS = 2 * 30,000 = 60,000
        // Gross Profit = 85,000 - 60,000 = 25,000
        // Gross Profit Margin = (25,000 / 85,000) * 100 = 29.41%
        $sale = Sale::create([
            'tenant_id'       => $this->tenantA->id,
            'user_id'         => $this->ownerA->id,
            'discount_type'   => 'fixed',
            'discount_amount' => 15000.00,
            'tax_amount'      => 18000.00,
            'total_amount'    => 103000.00,
            'payment_method'  => 'cash',
            'sale_date'       => '2026-10-10 10:30:00',
        ]);

        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 100000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-10&end_date=2026-10-10',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);

        $data = $response->json('data');

        $this->assertEquals(100000.00, (float) $data['gross_item_sales']);
        $this->assertEquals(15000.00, (float) $data['total_discounts']);
        $this->assertEquals(85000.00, (float) $data['net_sales_revenue']);
        $this->assertEquals(18000.00, (float) $data['tax_collected']);
        $this->assertEquals(103000.00, (float) $data['total_collected']);
        $this->assertEquals(60000.00, (float) $data['total_cogs']);
        $this->assertEquals(25000.00, (float) $data['gross_profit']);
        $this->assertEquals(29.41, (float) $data['gross_profit_margin']);
        $this->assertEquals(1, $data['transaction_count']);
    }

    /** Clamped discount cannot produce negative net revenue and reconciles effective/excess discounts & total_collected */
    public function test_discount_exceeding_subtotal_clamps_net_revenue_at_zero(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Sale 1 on 2026-10-11:
        // Gross item sales = 50,000
        // Raw discount = 80,000 (exceeds subtotal by 30,000)
        // Tax = 5,000
        // SaleController formula: max(0, 50,000 - 80,000 + 5,000) = 0.00
        $sale = Sale::create([
            'tenant_id'       => $this->tenantA->id,
            'user_id'         => $this->ownerA->id,
            'discount_type'   => 'fixed',
            'discount_amount' => 80000.00, // exceeds 50,000 subtotal
            'tax_amount'      => 5000.00,
            'total_amount'    => 0.00,
            'payment_method'  => 'cash',
            'sale_date'       => '2026-10-11 12:00:00',
        ]);

        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 1,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 50000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-11&end_date=2026-10-11',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(50000.00, (float) $data['gross_item_sales']);
        $this->assertEquals(80000.00, (float) $data['total_discounts']);
        $this->assertEquals(50000.00, (float) $data['effective_discounts']);
        $this->assertEquals(30000.00, (float) $data['excess_discounts']);
        $this->assertEquals(0.00, (float) $data['net_sales_revenue']);
        // Gross Item Sales - Effective Discounts = Net Sales Revenue
        $this->assertEquals(
            (float) $data['net_sales_revenue'],
            (float) $data['gross_item_sales'] - (float) $data['effective_discounts']
        );
        $this->assertEquals(5000.00, (float) $data['tax_collected']);
        // Total collected matches SaleController max(0, gross - rawDiscount + tax) = 0.00
        $this->assertEquals(0.00, (float) $data['total_collected']);
        $this->assertEquals(0.00, (float) $data['series'][0]['total_collected']);
        $this->assertEquals(50000.00, (float) $data['series'][0]['effective_discounts']);
        $this->assertEquals(30000.00, (float) $data['series'][0]['excess_discounts']);
    }

    /** Excess discount partially offsetting tax reconciles total_collected with sales.total_amount */
    public function test_excess_discount_partially_offsetting_tax_reconciles_total_collected_with_sale_total(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Gross item sales = 100,000
        // Raw discount = 105,000 (effective = 100,000, excess = 5,000)
        // Tax = 18,000
        // SaleController total_amount = max(0, 100,000 - 105,000 + 18,000) = 13,000
        $sale = Sale::create([
            'tenant_id'       => $this->tenantA->id,
            'user_id'         => $this->ownerA->id,
            'discount_type'   => 'fixed',
            'discount_amount' => 105000.00,
            'tax_amount'      => 18000.00,
            'total_amount'    => 13000.00,
            'payment_method'  => 'cash',
            'sale_date'       => '2026-10-11 15:00:00',
        ]);

        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 100000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-11&end_date=2026-10-11',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(100000.00, (float) $data['gross_item_sales']);
        $this->assertEquals(105000.00, (float) $data['total_discounts']);
        $this->assertEquals(100000.00, (float) $data['effective_discounts']);
        $this->assertEquals(5000.00, (float) $data['excess_discounts']);
        $this->assertEquals(0.00, (float) $data['net_sales_revenue']);
        $this->assertEquals(18000.00, (float) $data['tax_collected']);
        $this->assertEquals(13000.00, (float) $data['total_collected']);
    }

    /** 3. COGS uses recorded sale_items.cost_price when present */
    public function test_cogs_uses_recorded_sale_item_cost_price_when_present(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Product catalog cost_price is 30,000, but recorded snapshot on sale_item is 25,000
        $sale = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 100000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-10-12 09:00:00',
        ]);

        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => 25000.00, // recorded snapshot differs from productA1->cost_price (30,000)
            'subtotal'   => 100000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-12&end_date=2026-10-12',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        // COGS must be 2 * 25,000 = 50,000 (not 2 * 30,000 = 60,000)
        $this->assertEquals(50000.00, (float) $data['total_cogs']);
        $this->assertEquals(50000.00, (float) $data['gross_profit']);
        $this->assertEquals('recorded', $data['cost_status']);
        $this->assertTrue($data['cost_accuracy']['is_complete']);
        $this->assertFalse($data['cost_accuracy']['is_estimated']);
        $this->assertEquals(1, $data['cost_accuracy']['recorded_items']);
        $this->assertEquals(0, $data['cost_accuracy']['estimated_items']);
        $this->assertEquals(0, $data['cost_accuracy']['unavailable_items']);
    }

    /** 4. Historical NULL snapshots fall back to current product cost and are marked estimated */
    public function test_historical_null_snapshot_falls_back_to_product_cost_and_is_marked_estimated(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        $sale = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 100000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-10-13 14:00:00',
        ]);

        // Legacy sale item with cost_price = NULL
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id, // cost_price = 30,000
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => null,
            'subtotal'   => 100000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-13&end_date=2026-10-13',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        // Uses productA1->cost_price (2 * 30,000 = 60,000) as an estimate
        $this->assertEquals(60000.00, (float) $data['total_cogs']);
        $this->assertEquals(40000.00, (float) $data['gross_profit']);
        $this->assertEquals('estimated', $data['cost_status']);
        $this->assertTrue($data['cost_accuracy']['is_complete']);
        $this->assertTrue($data['cost_accuracy']['is_estimated']);
        $this->assertEquals(0, $data['cost_accuracy']['recorded_items']);
        $this->assertEquals(1, $data['cost_accuracy']['estimated_items']);
        $this->assertEquals(0, $data['cost_accuracy']['unavailable_items']);
        $this->assertEquals('estimated', $data['series'][0]['cost_status']);
    }

    /** 5. Missing both snapshot and product cost is marked unavailable and does not inflate profit */
    public function test_missing_both_snapshot_and_product_cost_is_marked_unavailable(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        $sale = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 80000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-10-14 15:00:00',
        ]);

        // Both sale_items.cost_price AND productNoCost->cost_price are NULL
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productNoCost->id,
            'quantity'   => 2,
            'price'      => 40000.00,
            'cost_price' => null,
            'subtotal'   => 80000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-14&end_date=2026-10-14',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(80000.00, (float) $data['net_sales_revenue']);
        $this->assertEquals('unavailable', $data['cost_status']);
        $this->assertFalse($data['cost_accuracy']['is_complete']);
        $this->assertTrue($data['cost_accuracy']['has_unavailable_costs']);
        $this->assertEquals(1, $data['cost_accuracy']['unavailable_items']);
        $this->assertEquals(1, $data['cost_accuracy']['unavailable_sales']);

        // Must NOT silently treat unknown cost as 0 to claim 80,000 gross profit
        $this->assertNull($data['total_cogs']);
        $this->assertNull($data['gross_profit']);
        $this->assertNull($data['gross_profit_margin']);
        $this->assertNull($data['series'][0]['gross_profit']);
        $this->assertEquals('unavailable', $data['series'][0]['cost_status']);
    }

    /** 6. New sale creation snapshots product cost in backend (ignoring any frontend cost_price) */
    public function test_new_sale_creation_snapshots_product_cost_and_ignores_client_cost(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA1->id,
                    'quantity'   => 2,
                    'price'      => 50000.00,
                    'cost_price' => 100.00, // maliciously low cost_price supplied by client must be ignored
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201);
        $saleId = $response->json('data.id');

        $this->assertDatabaseHas('sale_items', [
            'sale_id'    => $saleId,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => 30000.00, // productA1->cost_price snapshotted by backend
            'subtotal'   => 100000.00,
        ]);
    }

    /** 7. Bulk sale creation snapshots product cost */
    public function test_bulk_sale_creation_snapshots_product_cost(): void
    {
        $response = $this->postJson('/api/sales/bulk', [
            'sales' => [
                [
                    'payment_method' => 'cash',
                    'items' => [
                        [
                            'product_id' => $this->productA1->id,
                            'quantity'   => 1,
                            'price'      => 50000.00,
                        ],
                        [
                            'product_id' => $this->productA2->id,
                            'quantity'   => 3,
                            'price'      => 20000.00,
                        ],
                    ],
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201);
        $saleId = $response->json('data.0.id');

        $this->assertDatabaseHas('sale_items', [
            'sale_id'    => $saleId,
            'product_id' => $this->productA1->id,
            'cost_price' => 30000.00,
        ]);

        $this->assertDatabaseHas('sale_items', [
            'sale_id'    => $saleId,
            'product_id' => $this->productA2->id,
            'cost_price' => 12000.00,
        ]);
    }

    /** 8. Sale updates snapshot current product costs for newly created/replaced sale items */
    public function test_sale_update_snapshots_costs_for_newly_replaced_sale_items(): void
    {
        // Create initial sale with productA1 (cost_price = 30,000)
        $createRes = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA1->id,
                    'quantity'   => 1,
                    'price'      => 50000.00,
                ],
            ],
        ], $this->tokenFor($this->ownerA));

        $createRes->assertStatus(201);
        $saleId = $createRes->json('data.id');

        // Update productA2 cost_price to 15,000 before replacing sale items
        app()->instance('current_tenant', $this->tenantA);
        $this->productA2->update(['cost_price' => 15000.00]);
        app()->forgetInstance('current_tenant');

        // Update the sale to replace items with productA2
        $updateRes = $this->putJson("/api/sales/{$saleId}", [
            'payment_method' => 'mobile_money',
            'items' => [
                [
                    'product_id' => $this->productA2->id,
                    'quantity'   => 2,
                    'price'      => 25000.00,
                ],
            ],
        ], $this->tokenFor($this->ownerA));

        $updateRes->assertStatus(200);

        $this->assertDatabaseHas('sale_items', [
            'sale_id'    => $saleId,
            'product_id' => $this->productA2->id,
            'quantity'   => 2,
            'price'      => 25000.00,
            'cost_price' => 15000.00,
            'subtotal'   => 50000.00,
        ]);
    }

    /** 9. Changing a product's current cost does not change the COGS of sales with recorded snapshots */
    public function test_changing_product_cost_later_does_not_change_cogs_of_sales_with_recorded_snapshots(): void
    {
        // 1. Create sale when productA1 cost_price is 30,000
        $saleRes = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA1->id,
                    'quantity'   => 2,
                    'price'      => 50000.00,
                ],
            ],
        ], $this->tokenFor($this->ownerA));

        $saleRes->assertStatus(201);

        // 2. Later, update productA1's cost_price to 45,000
        app()->instance('current_tenant', $this->tenantA);
        $this->productA1->update(['cost_price' => 45000.00]);
        app()->forgetInstance('current_tenant');

        // 3. Query analytics for today
        $today = now()->toDateString();
        $analyticsRes = $this->getJson(
            "/api/reports/revenue-profit?group_by=daily&start_date={$today}&end_date={$today}",
            $this->tokenFor($this->ownerA)
        );

        $analyticsRes->assertStatus(200);
        $data = $analyticsRes->json('data');

        // COGS must still be 2 * 30,000 = 60,000 (not 2 * 45,000 = 90,000)
        // Gross Profit must still be 100,000 - 60,000 = 40,000
        $this->assertEquals(100000.00, (float) $data['net_sales_revenue']);
        $this->assertEquals(60000.00, (float) $data['total_cogs']);
        $this->assertEquals(40000.00, (float) $data['gross_profit']);
        $this->assertEquals('recorded', $data['cost_status']);
    }

    /** 10 & 11. Date grouping (daily, weekly Mon-Sun, monthly 12 months) and zero-filled buckets + date filters */
    public function test_date_groupings_zero_filled_buckets_and_date_filters_work_correctly(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Sale 1 on Wednesday 2026-05-06 (Week: Mon 2026-05-04 to Sun 2026-05-10)
        $saleMay = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 100000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-05-06 11:00:00',
        ]);
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $saleMay->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 100000.00,
        ]);

        // Sale 2 on Monday 2026-05-18 (Week: Mon 2026-05-18 to Sun 2026-05-24)
        $saleMay2 = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 40000.00,
            'payment_method' => 'mobile_money',
            'sale_date'      => '2026-05-18 16:00:00',
        ]);
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $saleMay2->id,
            'product_id' => $this->productA2->id,
            'quantity'   => 2,
            'price'      => 20000.00,
            'cost_price' => 12000.00,
            'subtotal'   => 40000.00,
        ]);

        // Sale 3 outside range on 2026-06-10
        $saleJune = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 50000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-06-10 10:00:00',
        ]);
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $saleJune->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 1,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 50000.00,
        ]);

        app()->forgetInstance('current_tenant');

        // A. Daily grouping from 2026-05-05 to 2026-05-08 (4 days: May 5, 6, 7, 8)
        $dailyRes = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-05-05&end_date=2026-05-08',
            $this->tokenFor($this->ownerA)
        );
        $dailyRes->assertStatus(200);
        $dailySeries = $dailyRes->json('data.series');
        $this->assertCount(4, $dailySeries);
        // May 5 (zero-filled)
        $this->assertEquals('2026-05-05', $dailySeries[0]['bucket_key']);
        $this->assertEquals(0.0, (float) $dailySeries[0]['net_sales_revenue']);
        $this->assertEquals(0, $dailySeries[0]['transaction_count']);
        // May 6 (Sale 1)
        $this->assertEquals('2026-05-06', $dailySeries[1]['bucket_key']);
        $this->assertEquals(100000.0, (float) $dailySeries[1]['net_sales_revenue']);
        $this->assertEquals(60000.0, (float) $dailySeries[1]['cogs']);
        $this->assertEquals(40000.0, (float) $dailySeries[1]['gross_profit']);
        // May 7 & May 8 (zero-filled)
        $this->assertEquals(0.0, (float) $dailySeries[2]['net_sales_revenue']);
        $this->assertEquals(0.0, (float) $dailySeries[3]['net_sales_revenue']);
        // Filtered total excludes May 18 and June 10 sales
        $this->assertEquals(100000.0, (float) $dailyRes->json('data.net_sales_revenue'));

        // B. Weekly grouping from 2026-05-04 to 2026-05-24 (3 Monday-Sunday weeks)
        $weeklyRes = $this->getJson(
            '/api/reports/revenue-profit?group_by=weekly&start_date=2026-05-04&end_date=2026-05-24',
            $this->tokenFor($this->ownerA)
        );
        $weeklyRes->assertStatus(200);
        $weeklySeries = $weeklyRes->json('data.series');
        $this->assertCount(3, $weeklySeries);
        // Week 1: Mon 2026-05-04 to Sun 2026-05-10 (has Sale 1 = 100,000)
        $this->assertEquals('2026-05-04', $weeklySeries[0]['start_date']);
        $this->assertEquals('2026-05-10', $weeklySeries[0]['end_date']);
        $this->assertEquals(100000.0, (float) $weeklySeries[0]['net_sales_revenue']);
        // Week 2: Mon 2026-05-11 to Sun 2026-05-17 (zero-filled)
        $this->assertEquals('2026-05-11', $weeklySeries[1]['start_date']);
        $this->assertEquals('2026-05-17', $weeklySeries[1]['end_date']);
        $this->assertEquals(0.0, (float) $weeklySeries[1]['net_sales_revenue']);
        // Week 3: Mon 2026-05-18 to Sun 2026-05-24 (has Sale 2 = 40,000)
        $this->assertEquals('2026-05-18', $weeklySeries[2]['start_date']);
        $this->assertEquals('2026-05-24', $weeklySeries[2]['end_date']);
        $this->assertEquals(40000.0, (float) $weeklySeries[2]['net_sales_revenue']);
        $this->assertEquals(140000.0, (float) $weeklyRes->json('data.net_sales_revenue'));

        // C. Monthly grouping for full year 2026 (12 zero-filled months)
        $monthlyRes = $this->getJson(
            '/api/reports/revenue-profit?group_by=monthly&year=2026',
            $this->tokenFor($this->ownerA)
        );
        $monthlyRes->assertStatus(200);
        $monthlySeries = $monthlyRes->json('data.series');
        $this->assertCount(12, $monthlySeries);
        // May (index 4) has 100,000 + 40,000 = 140,000
        $this->assertEquals('2026-05', $monthlySeries[4]['bucket_key']);
        $this->assertEquals(140000.0, (float) $monthlySeries[4]['net_sales_revenue']);
        // June (index 5) has 50,000
        $this->assertEquals('2026-06', $monthlySeries[5]['bucket_key']);
        $this->assertEquals(50000.0, (float) $monthlySeries[5]['net_sales_revenue']);
        // January (index 0) is zero-filled
        $this->assertEquals('2026-01', $monthlySeries[0]['bucket_key']);
        $this->assertEquals(0.0, (float) $monthlySeries[0]['net_sales_revenue']);
    }

    /** 12. Tenant isolation is strictly enforced */
    public function test_tenant_isolation_prevents_seeing_another_tenants_financial_data(): void
    {
        // Create a sale in Tenant A
        $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->productA1->id, 'quantity' => 2, 'price' => 50000.00],
            ],
        ], $this->tokenFor($this->ownerA))->assertStatus(201);

        // Create a much larger sale in Tenant B
        $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->productB1->id, 'quantity' => 5, 'price' => 100000.00],
            ],
        ], $this->tokenFor($this->ownerB))->assertStatus(201);

        $today = now()->toDateString();

        // Owner A queries analytics and attempts to spoof tenant_id = Tenant B
        $resA = $this->getJson(
            "/api/reports/revenue-profit?group_by=daily&start_date={$today}&end_date={$today}&tenant_id={$this->tenantB->id}",
            $this->tokenFor($this->ownerA)
        );

        $resA->assertStatus(200);
        // Owner A must ONLY see Tenant A's 100,000 revenue and 40,000 gross profit
        $this->assertEquals(100000.00, (float) $resA->json('data.net_sales_revenue'));
        $this->assertEquals(60000.00, (float) $resA->json('data.total_cogs'));
        $this->assertEquals(40000.00, (float) $resA->json('data.gross_profit'));
        $this->assertEquals(1, $resA->json('data.transaction_count'));

        // Owner B must ONLY see Tenant B's 500,000 revenue and 200,000 gross profit
        $resB = $this->getJson(
            "/api/reports/revenue-profit?group_by=daily&start_date={$today}&end_date={$today}",
            $this->tokenFor($this->ownerB)
        );
        $resB->assertStatus(200);
        $this->assertEquals(500000.00, (float) $resB->json('data.net_sales_revenue'));
        $this->assertEquals(300000.00, (float) $resB->json('data.total_cogs'));
        $this->assertEquals(200000.00, (float) $resB->json('data.gross_profit'));
        $this->assertEquals(1, $resB->json('data.transaction_count'));
    }

    /** 13. Authentication and permission rules are enforced */
    public function test_authentication_and_permission_enforcement_on_analytics_endpoint(): void
    {
        // Unauthenticated -> 401
        $this->getJson('/api/reports/revenue-profit')
             ->assertStatus(401);

        // Cashier without sales.report or reports.view -> 403
        $this->getJson('/api/reports/revenue-profit', $this->tokenFor($this->cashierA))
             ->assertStatus(403);

        // Custom role with sales.report permission -> 200
        $this->getJson('/api/reports/revenue-profit', $this->tokenFor($this->reportViewerA))
             ->assertStatus(200)
             ->assertJsonPath('success', true);
    }

    /** 14. Existing sales and report endpoints continue working without regression */
    public function test_existing_sales_and_report_endpoints_continue_working(): void
    {
        $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->productA1->id, 'quantity' => 2, 'price' => 50000.00],
            ],
        ], $this->tokenFor($this->ownerA))->assertStatus(201);

        $today = now()->toDateString();
        $month = now()->format('Y-m');
        $year  = now()->year;

        $this->getJson("/api/sales/daily-report?date={$today}", $this->tokenFor($this->ownerA))
             ->assertStatus(200)
             ->assertJsonPath('success', true)
             ->assertJsonPath('data.total_sales', 100000)
             ->assertJsonPath('data.total_cost', 60000)
             ->assertJsonPath('data.total_profit', 40000);

        $this->getJson("/api/sales/weekly-report?date={$today}", $this->tokenFor($this->ownerA))
             ->assertStatus(200)
             ->assertJsonPath('success', true)
             ->assertJsonPath('data.total_sales', 100000);

        $this->getJson("/api/sales/monthly-report?month={$month}", $this->tokenFor($this->ownerA))
             ->assertStatus(200)
             ->assertJsonPath('success', true)
             ->assertJsonPath('data.total_sales', 100000);

        $this->getJson("/api/sales/yearly-report?year={$year}", $this->tokenFor($this->ownerA))
             ->assertStatus(200)
             ->assertJsonPath('success', true)
             ->assertJsonPath('data.total_sales', 100000);
    }

    /** 15. Partial first and last weekly and monthly date boundaries clip bucket ranges and exclude out-of-range sales */
    public function test_partial_weekly_and_monthly_date_boundaries_clip_bucket_ranges_to_selected_dates(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Calendar week is Mon 2026-05-04 to Sun 2026-05-10.
        // Sale on Mon 2026-05-04 (outside partial range 2026-05-06 .. 2026-05-20)
        $saleOutWeek1 = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 50000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-05-04 09:00:00',
        ]);
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $saleOutWeek1->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 1,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 50000.00,
        ]);

        // Sale on Thu 2026-05-07 (inside partial first week 2026-05-06 .. 2026-05-10)
        $saleInWeek1 = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 100000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-05-07 14:00:00',
        ]);
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $saleInWeek1->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 100000.00,
        ]);

        // Sale on Fri 2026-05-22 (outside partial last week 2026-05-18 .. 2026-05-20, but in same calendar week)
        $saleOutWeek3 = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 40000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-05-22 11:00:00',
        ]);
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $saleOutWeek3->id,
            'product_id' => $this->productA2->id,
            'quantity'   => 2,
            'price'      => 20000.00,
            'cost_price' => 12000.00,
            'subtotal'   => 40000.00,
        ]);

        app()->forgetInstance('current_tenant');

        // A. Partial weekly range: Wed 2026-05-06 to Wed 2026-05-20
        $weeklyRes = $this->getJson(
            '/api/reports/revenue-profit?group_by=weekly&start_date=2026-05-06&end_date=2026-05-20',
            $this->tokenFor($this->ownerA)
        );
        $weeklyRes->assertStatus(200);
        $weeklySeries = $weeklyRes->json('data.series');
        $this->assertCount(3, $weeklySeries);

        // First week is clipped to 2026-05-06 .. 2026-05-10 (partial = true)
        $this->assertEquals('2026-05-06', $weeklySeries[0]['start_date']);
        $this->assertEquals('2026-05-10', $weeklySeries[0]['end_date']);
        $this->assertEquals('2026-05-06', $weeklySeries[0]['week_start']);
        $this->assertEquals('2026-05-10', $weeklySeries[0]['week_end']);
        $this->assertTrue($weeklySeries[0]['is_partial']);
        $this->assertEquals(100000.00, (float) $weeklySeries[0]['net_sales_revenue']); // excludes May 4 sale

        // Middle week is full: 2026-05-11 .. 2026-05-17 (partial = false)
        $this->assertEquals('2026-05-11', $weeklySeries[1]['start_date']);
        $this->assertEquals('2026-05-17', $weeklySeries[1]['end_date']);
        $this->assertFalse($weeklySeries[1]['is_partial']);

        // Last week is clipped to 2026-05-18 .. 2026-05-20 (partial = true)
        $this->assertEquals('2026-05-18', $weeklySeries[2]['start_date']);
        $this->assertEquals('2026-05-20', $weeklySeries[2]['end_date']);
        $this->assertEquals('2026-05-18', $weeklySeries[2]['week_start']);
        $this->assertEquals('2026-05-20', $weeklySeries[2]['week_end']);
        $this->assertTrue($weeklySeries[2]['is_partial']);
        $this->assertEquals(0.00, (float) $weeklySeries[2]['net_sales_revenue']); // excludes May 22 sale

        // B. Partial monthly range: 2026-05-06 to 2026-06-15
        $monthlyRes = $this->getJson(
            '/api/reports/revenue-profit?group_by=monthly&start_date=2026-05-06&end_date=2026-06-15',
            $this->tokenFor($this->ownerA)
        );
        $monthlyRes->assertStatus(200);
        $monthlySeries = $monthlyRes->json('data.series');
        $this->assertCount(2, $monthlySeries);

        // May bucket is clipped to 2026-05-06 .. 2026-05-31 (partial = true)
        $this->assertEquals('2026-05', $monthlySeries[0]['bucket_key']);
        $this->assertEquals('2026-05-06', $monthlySeries[0]['start_date']);
        $this->assertEquals('2026-05-31', $monthlySeries[0]['end_date']);
        $this->assertTrue($monthlySeries[0]['is_partial']);
        $this->assertEquals('May 06 - May 31, 2026', $monthlySeries[0]['label']);
        // Includes May 7 (100k) and May 22 (40k), excludes May 4 (50k) => 140k
        $this->assertEquals(140000.00, (float) $monthlySeries[0]['net_sales_revenue']);

        // June bucket is clipped to 2026-06-01 .. 2026-06-15 (partial = true)
        $this->assertEquals('2026-06', $monthlySeries[1]['bucket_key']);
        $this->assertEquals('2026-06-01', $monthlySeries[1]['start_date']);
        $this->assertEquals('2026-06-15', $monthlySeries[1]['end_date']);
        $this->assertTrue($monthlySeries[1]['is_partial']);
    }

    /** 16. Legacy report endpoints never silently treat missing product costs as zero */
    public function test_legacy_report_endpoints_do_not_treat_missing_product_costs_as_zero(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        $sale = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 80000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-08-15 11:00:00',
        ]);

        // Both sale_items.cost_price and productNoCost->cost_price are NULL
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productNoCost->id,
            'quantity'   => 2,
            'price'      => 40000.00,
            'cost_price' => null,
            'subtotal'   => 80000.00,
        ]);

        app()->forgetInstance('current_tenant');

        // Daily report
        $dailyRes = $this->getJson('/api/sales/daily-report?date=2026-08-15', $this->tokenFor($this->ownerA));
        $dailyRes->assertStatus(200)
                 ->assertJsonPath('data.total_sales', 80000)
                 ->assertJsonPath('data.cost_status', 'unavailable')
                 ->assertJsonPath('data.total_cost', null)
                 ->assertJsonPath('data.total_profit', null);

        // Weekly report
        $weeklyRes = $this->getJson('/api/sales/weekly-report?date=2026-08-15', $this->tokenFor($this->ownerA));
        $weeklyRes->assertStatus(200)
                  ->assertJsonPath('data.total_sales', 80000)
                  ->assertJsonPath('data.cost_status', 'unavailable')
                  ->assertJsonPath('data.total_cost', null)
                  ->assertJsonPath('data.total_profit', null);

        // Monthly report
        $monthlyRes = $this->getJson('/api/sales/monthly-report?month=2026-08', $this->tokenFor($this->ownerA));
        $monthlyRes->assertStatus(200)
                   ->assertJsonPath('data.total_sales', 80000)
                   ->assertJsonPath('data.cost_status', 'unavailable')
                   ->assertJsonPath('data.total_cost', null)
                   ->assertJsonPath('data.total_profit', null);

        // Yearly report
        $yearlyRes = $this->getJson('/api/sales/yearly-report?year=2026', $this->tokenFor($this->ownerA));
        $yearlyRes->assertStatus(200)
                  ->assertJsonPath('data.total_sales', 80000)
                  ->assertJsonPath('data.cost_status', 'unavailable')
                  ->assertJsonPath('data.total_cost', null)
                  ->assertJsonPath('data.total_profit', null);
    }

    /** 17. Legacy report endpoints mark historical null snapshot with current product cost as estimated */
    public function test_legacy_report_endpoints_mark_historical_null_snapshot_with_product_cost_as_estimated(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        $sale = Sale::create([
            'tenant_id'      => $this->tenantA->id,
            'user_id'        => $this->ownerA->id,
            'total_amount'   => 100000.00,
            'payment_method' => 'cash',
            'sale_date'      => '2026-08-20 11:00:00',
        ]);

        // Historical item with cost_price = null, productA1->cost_price = 30,000
        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 2,
            'price'      => 50000.00,
            'cost_price' => null,
            'subtotal'   => 100000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $dailyRes = $this->getJson('/api/sales/daily-report?date=2026-08-20', $this->tokenFor($this->ownerA));
        $dailyRes->assertStatus(200)
                 ->assertJsonPath('data.total_sales', 100000)
                 ->assertJsonPath('data.cost_status', 'estimated')
                 ->assertJsonPath('data.total_cost', 60000)
                 ->assertJsonPath('data.total_profit', 40000);
    }

    /** 18. Invalid date range (start_date > end_date) returns 422 validation error */
    public function test_invalid_date_range_returns_422_validation_error(): void
    {
        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-20&end_date=2026-10-10',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['end_date']);
    }

    /** 19. Empty period returns zero-filled buckets and no_sales cost status */
    public function test_empty_period_returns_zero_filled_buckets_and_no_sales_cost_status(): void
    {
        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-02-01&end_date=2026-02-03',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(0.00, (float) $data['gross_item_sales']);
        $this->assertEquals(0.00, (float) $data['net_sales_revenue']);
        $this->assertEquals(0.00, (float) $data['total_cogs']);
        $this->assertEquals(0.00, (float) $data['gross_profit']);
        $this->assertEquals(0, $data['transaction_count']);
        $this->assertEquals('no_sales', $data['cost_status']);
        $this->assertCount(3, $data['series']);
        $this->assertEquals('no_sales', $data['series'][0]['cost_status']);
    }

    /** 20. Negative gross profit when COGS exceeds net sales revenue */
    public function test_negative_gross_profit_when_cogs_exceeds_net_sales_revenue(): void
    {
        app()->instance('current_tenant', $this->tenantA);

        // Item subtotal = 50,000, Discount = 30,000 => Net Revenue = 20,000
        // COGS = 30,000 => Gross Profit = -10,000, Margin = (-10,000 / 20,000) * 100 = -50.0%
        $sale = Sale::create([
            'tenant_id'       => $this->tenantA->id,
            'user_id'         => $this->ownerA->id,
            'discount_type'   => 'fixed',
            'discount_amount' => 30000.00,
            'tax_amount'      => 0.00,
            'total_amount'    => 20000.00,
            'payment_method'  => 'cash',
            'sale_date'       => '2026-10-19 10:00:00',
        ]);

        SaleItem::create([
            'tenant_id'  => $this->tenantA->id,
            'sale_id'    => $sale->id,
            'product_id' => $this->productA1->id,
            'quantity'   => 1,
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'subtotal'   => 50000.00,
        ]);

        app()->forgetInstance('current_tenant');

        $response = $this->getJson(
            '/api/reports/revenue-profit?group_by=daily&start_date=2026-10-19&end_date=2026-10-19',
            $this->tokenFor($this->ownerA)
        );

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals(20000.00, (float) $data['net_sales_revenue']);
        $this->assertEquals(30000.00, (float) $data['total_cogs']);
        $this->assertEquals(-10000.00, (float) $data['gross_profit']);
        $this->assertEquals(-50.00, (float) $data['gross_profit_margin']);
        $this->assertEquals(-10000.00, (float) $data['series'][0]['gross_profit']);
    }
}
