<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SaleCustomPriceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $cashierA;
    private User $ownerA;
    private User $unauthorizedUser;
    private Product $productA;
    private Product $productB;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Tenant A and Tenant B
        $this->tenantA = Tenant::create([
            'name'  => 'Tenant A ' . uniqid(),
            'email' => 'tenantA_' . uniqid() . '@example.com',
        ]);

        $this->tenantB = Tenant::create([
            'name'  => 'Tenant B ' . uniqid(),
            'email' => 'tenantB_' . uniqid() . '@example.com',
        ]);

        // Roles
        $cashierRole = Role::firstOrCreate(
            ['name' => 'cashier', 'tenant_id' => null],
            ['description' => 'Cashier', 'is_default' => true]
        );

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $staffRole = Role::firstOrCreate(
            ['name' => 'staff', 'tenant_id' => null],
            ['description' => 'Staff without sales', 'is_default' => true]
        );

        // Cashier in Tenant A
        $this->cashierA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Cashier A',
            'email'     => 'cashier_' . uniqid() . '@example.com',
            'username'  => 'cashier_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->cashierA->roles()->attach($cashierRole->id);

        // Owner in Tenant A
        $this->ownerA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Owner A',
            'email'     => 'owner_' . uniqid() . '@example.com',
            'username'  => 'owner_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->ownerA->roles()->attach($ownerRole->id);

        // Unauthorized user in Tenant A (has 'staff' role with no sales.create permission)
        $this->unauthorizedUser = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Unauthorized Staff',
            'email'     => 'unauth_' . uniqid() . '@example.com',
            'username'  => 'unauth_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->unauthorizedUser->roles()->attach($staffRole->id);

        // Product in Tenant A (default price = 50,000, cost = 30,000, stock = 20)
        app()->instance('current_tenant', $this->tenantA);
        $this->productA = Product::create([
            'tenant_id'  => $this->tenantA->id,
            'name'       => 'Widget A',
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'stock'      => 20,
        ]);

        // Product in Tenant B (default price = 100,000, stock = 10)
        app()->instance('current_tenant', $this->tenantB);
        $this->productB = Product::create([
            'tenant_id'  => $this->tenantB->id,
            'name'       => 'Widget B',
            'price'      => 100000.00,
            'cost_price' => 60000.00,
            'stock'      => 10,
        ]);

        app()->forgetInstance('current_tenant');
    }

    private function tokenFor(User $user): array
    {
        $token = $user->createToken('test-token')->plainTextToken;
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept'        => 'application/json',
        ];
    }

    /** 1. Selling above the default price */
    public function test_can_sell_product_above_default_selling_price(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 2,
                    'price'      => 65000.00, // higher than default 50,000
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertEquals(130000.00, (float) $response->json('data.total_amount'));

        // Verify sale item stores custom price and subtotal
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $this->productA->id,
            'quantity'   => 2,
            'price'      => 65000.00,
            'subtotal'   => 130000.00,
        ]);

        // Verify default product price remains completely unchanged at 50,000
        $this->productA->refresh();
        $this->assertEquals(50000.00, (float) $this->productA->price);
        $this->assertEquals(18, $this->productA->stock);
    }

    /** 2. Selling below the default price */
    public function test_can_sell_product_below_default_selling_price(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 3,
                    'price'      => 35000.00, // lower than default 50,000
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertEquals(105000.00, (float) $response->json('data.total_amount'));

        // Verify sale item stores custom lower price and recalculated subtotal
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $this->productA->id,
            'quantity'   => 3,
            'price'      => 35000.00,
            'subtotal'   => 105000.00,
        ]);

        // Verify default product price remains unchanged at 50,000
        $this->productA->refresh();
        $this->assertEquals(50000.00, (float) $this->productA->price);
        $this->assertEquals(17, $this->productA->stock);
    }

    /** 3. Discounts and taxes produce correct totals with custom price */
    public function test_custom_price_with_discounts_and_taxes_produces_correct_totals(): void
    {
        // Custom price = 40,000, Qty = 2 => items subtotal = 80,000
        // Discount = 5,000 fixed
        // Tax = 10,000
        // Grand total = 80,000 - 5,000 + 10,000 = 85,000
        $response = $this->postJson('/api/sales', [
            'payment_method'  => 'mobile_money',
            'discount_type'   => 'fixed',
            'discount_amount' => 5000.00,
            'tax_amount'      => 10000.00,
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 2,
                    'price'      => 40000.00,
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertEquals(85000.00, (float) $response->json('data.total_amount'));
        $this->assertEquals(5000.00, (float) $response->json('data.discount_amount'));
        $this->assertEquals(10000.00, (float) $response->json('data.tax_amount'));
    }

    /** 4. Negative price is rejected */
    public function test_negative_price_is_rejected(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    'price'      => -500.00,
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('items.0.price');
    }

    /** 5. Non-numeric price is rejected */
    public function test_non_numeric_price_is_rejected(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    'price'      => 'not-a-valid-number',
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('items.0.price');
    }

    /** 6. Missing price is rejected */
    public function test_missing_price_is_rejected(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    // 'price' omitted
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('items.0.price');
    }

    /** 7. Tenant isolation prevents selling another tenant's product */
    public function test_tenant_isolation_prevents_selling_another_tenants_product_with_custom_price(): void
    {
        $initialStockB = $this->productB->stock;
        $salesCountBefore = Sale::count();
        $saleItemsCountBefore = SaleItem::count();
        $stockMovementsCountBefore = StockMovement::count();

        // Cashier in Tenant A attempts to sell productB which belongs to Tenant B
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productB->id,
                    'quantity'   => 1,
                    'price'      => 80000.00,
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        // BelongsToTenant scope prevents finding productB under Tenant A
        $response->assertStatus(422);

        // Verify sales, sale_items, and stock_movements counts remain unchanged after rejection
        $this->assertEquals($salesCountBefore, Sale::count(), 'Sales count must remain unchanged after cross-tenant rejection.');
        $this->assertEquals($saleItemsCountBefore, SaleItem::count(), 'Sale items count must remain unchanged after cross-tenant rejection.');
        $this->assertEquals($stockMovementsCountBefore, StockMovement::count(), 'Stock movements count must remain unchanged after cross-tenant rejection.');

        $this->assertDatabaseCount('sales', $salesCountBefore);
        $this->assertDatabaseCount('sale_items', $saleItemsCountBefore);
        $this->assertDatabaseCount('stock_movements', $stockMovementsCountBefore);

        // Verify Tenant B's product stock and price remain completely untouched
        $this->productB->refresh();
        $this->assertEquals($initialStockB, $this->productB->stock);
        $this->assertEquals(100000.00, (float) $this->productB->price);
    }

    /** 8. Unauthorized user cannot create sales even with custom price */
    public function test_unauthorized_user_cannot_create_sales(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    'price'      => 50000.00,
                ],
            ],
        ], $this->tokenFor($this->unauthorizedUser));

        $response->assertStatus(403)
                 ->assertJsonPath('success', false)
                 ->assertJsonPath('message', 'You do not have permission to create sales.');
    }

    /** 9. Changing catalog product price later preserves historical sale item price */
    public function test_changing_catalog_price_later_preserves_historical_sale_item_price(): void
    {
        // 1. Complete sale at custom price 45,000
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 2,
                    'price'      => 45000.00,
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201);
        $saleId = $response->json('data.id');

        // 2. Later, product catalog price is updated to 75,000
        app()->instance('current_tenant', $this->tenantA);
        $this->productA->update(['price' => 75000.00]);
        app()->forgetInstance('current_tenant');

        // 3. Fetch the sale details
        $fetchResponse = $this->getJson("/api/sales/{$saleId}", $this->tokenFor($this->cashierA));

        $fetchResponse->assertStatus(200);
        $saleItem = $fetchResponse->json('data.sale_items.0');

        // Verify the recorded sale item price is still 45,000, subtotal 90,000
        $this->assertEquals('45000.00', $saleItem['price']);
        $this->assertEquals('90000.00', $saleItem['subtotal']);
        $this->assertEquals('90000.00', $fetchResponse->json('data.total_amount'));
    }

    /** 10. Selling with a decimal custom price produces accurate totals */
    public function test_can_sell_product_with_decimal_custom_price(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 2,
                    'price'      => 12500.50,
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertEquals(25001.00, (float) $response->json('data.total_amount'));

        $this->assertDatabaseHas('sale_items', [
            'product_id' => $this->productA->id,
            'quantity'   => 2,
            'price'      => 12500.50,
            'subtotal'   => 25001.00,
        ]);
    }

    /** 11. Selling with zero custom price is accepted as a valid deliberate price */
    public function test_can_sell_product_with_zero_custom_price(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    'price'      => 0.00,
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $this->assertEquals(0.00, (float) $response->json('data.total_amount'));

        $this->assertDatabaseHas('sale_items', [
            'product_id' => $this->productA->id,
            'quantity'   => 1,
            'price'      => 0.00,
            'subtotal'   => 0.00,
        ]);
    }

    /** 12. Raw unparsed currency string sent directly to API is rejected */
    public function test_raw_unparsed_currency_string_is_rejected(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    'price'      => 'UGX 50,000',
                ],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('items.0.price');
    }
}
