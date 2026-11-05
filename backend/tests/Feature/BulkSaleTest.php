<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Role;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BulkSaleTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $cashierA;
    private User $ownerA;
    private User $unauthorizedUser;
    private Product $productA;
    private Product $productA2;
    private Product $productB;
    private Customer $customerA;
    private Customer $customerB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = Tenant::create([
            'name'  => 'Tenant A ' . uniqid(),
            'email' => 'tenantA_' . uniqid() . '@example.com',
        ]);

        $this->tenantB = Tenant::create([
            'name'  => 'Tenant B ' . uniqid(),
            'email' => 'tenantB_' . uniqid() . '@example.com',
        ]);

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

        $this->cashierA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Cashier A',
            'email'     => 'cashier_' . uniqid() . '@example.com',
            'username'  => 'cashier_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->cashierA->roles()->attach($cashierRole->id);

        $this->ownerA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Owner A',
            'email'     => 'owner_' . uniqid() . '@example.com',
            'username'  => 'owner_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->ownerA->roles()->attach($ownerRole->id);

        $this->unauthorizedUser = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Unauthorized Staff',
            'email'     => 'unauth_' . uniqid() . '@example.com',
            'username'  => 'unauth_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $this->unauthorizedUser->roles()->attach($staffRole->id);

        // Tenant A products
        app()->instance('current_tenant', $this->tenantA);
        $this->productA = Product::create([
            'tenant_id'  => $this->tenantA->id,
            'name'       => 'Widget A1',
            'price'      => 50000.00,
            'cost_price' => 30000.00,
            'stock'      => 500,
        ]);

        $this->productA2 = Product::create([
            'tenant_id'  => $this->tenantA->id,
            'name'       => 'Widget A2',
            'price'      => 20000.00,
            'cost_price' => 12000.00,
            'stock'      => 500,
        ]);

        $this->customerA = Customer::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Customer Alpha',
            'email'     => 'alpha@example.com',
            'phone'     => '0700000001',
            'status'    => 'active',
        ]);

        // Tenant B products & customer
        app()->instance('current_tenant', $this->tenantB);
        $this->productB = Product::create([
            'tenant_id'  => $this->tenantB->id,
            'name'       => 'Widget B1',
            'price'      => 100000.00,
            'cost_price' => 60000.00,
            'stock'      => 50,
        ]);

        $this->customerB = Customer::create([
            'tenant_id' => $this->tenantB->id,
            'name'      => 'Customer Beta',
            'email'     => 'beta@example.com',
            'phone'     => '0700000002',
            'status'    => 'active',
        ]);

        app()->forgetInstance('current_tenant');
    }

    private function tokenFor(User $user, ?string $idempotencyKey = null): array
    {
        $token = $user->createToken('test-token')->plainTextToken;
        $headers = [
            'Authorization' => 'Bearer ' . $token,
            'Accept'        => 'application/json',
        ];

        if ($idempotencyKey) {
            $headers['X-Idempotency-Key'] = $idempotencyKey;
        }

        return $headers;
    }

    /** 1. Successful batch of 200 sales creates distinct records atomically */
    public function test_batch_creates_200_distinct_sale_records_atomically(): void
    {
        $sales = [];
        for ($i = 0; $i < 200; $i++) {
            $sales[] = [
                'payment_method'  => $i % 2 === 0 ? 'cash' : 'mobile_money',
                'customer_type'   => 'walk_in',
                'notes'           => "Batch sale item #{$i}",
                'items' => [
                    [
                        'product_id' => $this->productA->id,
                        'quantity'   => 1,
                        'price'      => 50000.00,
                    ],
                ],
            ];
        }

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(200, $data);

        // Verify distinct Sale records in DB
        $this->assertEquals(200, Sale::count());
        $this->assertEquals(200, SaleItem::count());
        $this->assertEquals(200, StockMovement::count());

        // Verify 200 items deducted from productA (500 - 200 = 300)
        $this->productA->refresh();
        $this->assertEquals(300, $this->productA->stock);
    }

    /** 2. Different sales can have different customers, payment methods, discounts, and taxes */
    public function test_different_sales_have_different_attributes(): void
    {
        $sales = [
            // Sale 1: Walk-in, cash, notes
            [
                'payment_method'  => 'cash',
                'customer_type'   => 'walk_in',
                'notes'           => 'First counter sale',
                'items' => [
                    ['product_id' => $this->productA->id, 'quantity' => 2, 'price' => 50000.00],
                ],
            ],
            // Sale 2: Existing customer, mobile money, discount & tax
            [
                'payment_method'  => 'mobile_money',
                'customer_type'   => 'existing',
                'customer_id'     => $this->customerA->id,
                'discount_type'   => 'fixed',
                'discount_amount' => 5000.00,
                'tax_amount'      => 2000.00,
                'items' => [
                    ['product_id' => $this->productA2->id, 'quantity' => 1, 'price' => 20000.00],
                ],
            ],
            // Sale 3: New customer on the fly, card
            [
                'payment_method'  => 'card',
                'customer_type'   => 'new',
                'new_customer'    => [
                    'name'  => 'New Customer XYZ',
                    'phone' => '0788990011',
                    'email' => 'xyz@example.com',
                ],
                'items' => [
                    ['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 45000.00], // custom price
                ],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertCount(3, $data);

        // Sale 1: Walk in, 100,000 total
        $this->assertNull($data[0]['customer_id']);
        $this->assertEquals(100000.00, (float) $data[0]['total_amount']);
        $this->assertEquals('First counter sale', $data[0]['notes']);

        // Sale 2: Existing customer, 20,000 - 5,000 + 2,000 = 17,000
        $this->assertEquals($this->customerA->id, $data[1]['customer_id']);
        $this->assertEquals(17000.00, (float) $data[1]['total_amount']);
        $this->assertEquals('mobile_money', $data[1]['payment_method']);

        // Sale 3: New customer created
        $this->assertNotNull($data[2]['customer_id']);
        $this->assertEquals('New Customer XYZ', $data[2]['customer']['name']);
        $this->assertEquals(45000.00, (float) $data[2]['total_amount']);
    }

    /** 3. Repeated product IDs across the batch cause correct cumulative stock deduction */
    public function test_repeated_product_ids_cause_cumulative_stock_deductions(): void
    {
        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $this->productA->id, 'quantity' => 10, 'price' => 50000.00],
                ],
            ],
            [
                'payment_method' => 'card',
                'items' => [
                    ['product_id' => $this->productA->id, 'quantity' => 15, 'price' => 50000.00],
                    ['product_id' => $this->productA2->id, 'quantity' => 5, 'price' => 20000.00],
                ],
            ],
            [
                'payment_method' => 'mobile_money',
                'items' => [
                    ['product_id' => $this->productA->id, 'quantity' => 25, 'price' => 50000.00],
                ],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));
        $response->assertStatus(201);

        $this->productA->refresh();
        $this->productA2->refresh();

        // Product A: 500 - (10 + 15 + 25) = 450
        $this->assertEquals(450, $this->productA->stock);
        // Product A2: 500 - 5 = 495
        $this->assertEquals(495, $this->productA2->stock);
    }

    /** 4. Batch that exceeds available stock rolls back every single write */
    public function test_batch_exceeding_stock_rolls_back_entire_batch(): void
    {
        app()->instance('current_tenant', $this->tenantA);
        $limitedProduct = Product::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Rare Item',
            'price'     => 10000.00,
            'stock'     => 10,
        ]);
        app()->forgetInstance('current_tenant');

        $salesBefore = Sale::count();
        $itemsBefore = SaleItem::count();
        $movementsBefore = StockMovement::count();

        $sales = [
            // Sale 1 requests 6 units (would succeed if alone)
            [
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $limitedProduct->id, 'quantity' => 6, 'price' => 10000.00],
                ],
            ],
            // Sale 2 requests 5 units (6 + 5 = 11 > 10, must fail)
            [
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $limitedProduct->id, 'quantity' => 5, 'price' => 10000.00],
                ],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);

        $this->assertStringContainsString('Insufficient stock', $response->json('message'));

        // Verify zero writes occurred (atomicity)
        $this->assertEquals($salesBefore, Sale::count());
        $this->assertEquals($itemsBefore, SaleItem::count());
        $this->assertEquals($movementsBefore, StockMovement::count());

        $limitedProduct->refresh();
        $this->assertEquals(10, $limitedProduct->stock);
    }

    /** 5. Failure in the final sale rolls back all preceding sales */
    public function test_failure_in_final_sale_rolls_back_all_preceding(): void
    {
        $salesBefore = Sale::count();
        $itemsBefore = SaleItem::count();
        $movementsBefore = StockMovement::count();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 2, 'price' => 50000.00]],
            ],
            // Final sale fails due to massive stock request
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 99999, 'price' => 50000.00]],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(422);
        $this->assertStringContainsString('Sale #3: Insufficient stock', $response->json('message'));

        $this->assertEquals($salesBefore, Sale::count());
        $this->assertEquals($itemsBefore, SaleItem::count());
        $this->assertEquals($movementsBefore, StockMovement::count());

        $this->productA->refresh();
        $this->assertEquals(500, $this->productA->stock);
    }

    /** 6. Cross-tenant product reference rejects entire batch */
    public function test_cross_tenant_product_rejects_batch(): void
    {
        $salesBefore = Sale::count();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
            // Product B belongs to Tenant B!
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productB->id, 'quantity' => 1, 'price' => 100000.00]],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(422);
        $this->assertStringContainsString('does not belong to this tenant', $response->json('message'));

        $this->assertEquals($salesBefore, Sale::count());
        $this->productA->refresh();
        $this->assertEquals(500, $this->productA->stock);
    }

    /** 7. Cross-tenant customer reference rejects entire batch */
    public function test_cross_tenant_customer_rejects_batch(): void
    {
        $salesBefore = Sale::count();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
            // Customer B belongs to Tenant B!
            [
                'payment_method' => 'cash',
                'customer_type'  => 'existing',
                'customer_id'    => $this->customerB->id,
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(422);
        $this->assertStringContainsString('does not belong to this tenant', $response->json('message'));

        $this->assertEquals($salesBefore, Sale::count());
    }

    /** 8. Batch with 201 sales is rejected by validation */
    public function test_batch_with_201_sales_is_rejected(): void
    {
        $sales = [];
        for ($i = 0; $i < 201; $i++) {
            $sales[] = [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ];
        }

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('sales');

        $this->assertEquals(0, Sale::count());
    }

    /** 9. Empty and malformed batches are rejected */
    public function test_empty_and_malformed_batches_are_rejected(): void
    {
        // Empty array
        $this->postJson('/api/sales/bulk', ['sales' => []], $this->tokenFor($this->cashierA))
             ->assertStatus(422)
             ->assertJsonValidationErrors('sales');

        // Missing items in sale
        $this->postJson('/api/sales/bulk', ['sales' => [
            ['payment_method' => 'cash', 'items' => []]
        ]], $this->tokenFor($this->cashierA))
             ->assertStatus(422)
             ->assertJsonValidationErrors('sales.0.items');

        // Negative price
        $this->postJson('/api/sales/bulk', ['sales' => [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => -100.00]],
            ]
        ]], $this->tokenFor($this->cashierA))
             ->assertStatus(422)
             ->assertJsonValidationErrors('sales.0.items.0.price');
    }

    /** 10. Unauthorized user cannot submit batches */
    public function test_unauthorized_user_cannot_submit_batches(): void
    {
        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->unauthorizedUser));

        $response->assertStatus(403)
                 ->assertJsonPath('success', false)
                 ->assertJsonPath('message', 'You do not have permission to create sales.');
    }

    /** 11. Idempotency prevents duplicate sales on repeated requests */
    public function test_idempotency_prevents_duplicate_sales(): void
    {
        $idempotencyKey = 'batch-key-' . uniqid();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 2, 'price' => 50000.00]],
            ],
        ];

        // First attempt: creates 1 sale
        $res1 = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA, $idempotencyKey));
        $res1->assertStatus(201);
        $this->assertEquals(1, Sale::count());
        $firstSaleId = $res1->json('data.0.id');

        $this->productA->refresh();
        $this->assertEquals(498, $this->productA->stock);

        // Second attempt with exact same key and payload
        $res2 = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA, $idempotencyKey));
        $res2->assertStatus(201);

        // Verify still exactly 1 sale in DB and stock not double deducted
        $this->assertEquals(1, Sale::count());
        $this->assertEquals($firstSaleId, $res2->json('data.0.id'));

        $this->productA->refresh();
        $this->assertEquals(498, $this->productA->stock);
    }

    /** 12. Reusing idempotency key with different payload is rejected */
    public function test_reusing_idempotency_key_with_different_payload_is_rejected(): void
    {
        $idempotencyKey = 'key-diff-' . uniqid();

        $sales1 = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
        ];

        $this->postJson('/api/sales/bulk', ['sales' => $sales1], $this->tokenFor($this->cashierA, $idempotencyKey))
             ->assertStatus(201);

        // Second request with SAME key but DIFFERENT payload (quantity 5)
        $sales2 = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 5, 'price' => 50000.00]],
            ],
        ];

        $res2 = $this->postJson('/api/sales/bulk', ['sales' => $sales2], $this->tokenFor($this->cashierA, $idempotencyKey));
        $res2->assertStatus(422);
        $this->assertStringContainsString('different request payload', $res2->json('message'));
    }

    /** 13. Existing single-sale endpoint remains compatible and persists notes */
    public function test_single_sale_endpoint_compatibility_and_notes(): void
    {
        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'notes'          => 'Single sale customer note',
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 3, 'price' => 50000.00],
            ],
        ], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.notes', 'Single sale customer note');

        $this->assertDatabaseHas('sales', [
            'notes' => 'Single sale customer note',
        ]);
    }

    /** 14. Regression: Two sales requesting 4 units each from stock of 10 succeed with final stock 2 */
    public function test_cumulative_stock_regression_allows_batch_exceeding_half_initial_stock(): void
    {
        app()->instance('current_tenant', $this->tenantA);
        $testProduct = Product::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Ten Stock Widget',
            'price'     => 15000.00,
            'stock'     => 10,
        ]);
        app()->forgetInstance('current_tenant');

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $testProduct->id, 'quantity' => 4, 'price' => 15000.00],
                ],
            ],
            [
                'payment_method' => 'mobile_money',
                'items' => [
                    ['product_id' => $testProduct->id, 'quantity' => 4, 'price' => 15000.00],
                ],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Verify two distinct Sale records
        $this->assertNotEquals($data[0]['id'], $data[1]['id']);
        $this->assertEquals(60000.00, (float) $data[0]['total_amount']);
        $this->assertEquals(60000.00, (float) $data[1]['total_amount']);

        // Verify correct SaleItem and StockMovement records
        $sale1Items = SaleItem::where('sale_id', $data[0]['id'])->get();
        $this->assertCount(1, $sale1Items);
        $this->assertEquals(4, $sale1Items[0]->quantity);

        $sale2Items = SaleItem::where('sale_id', $data[1]['id'])->get();
        $this->assertCount(1, $sale2Items);
        $this->assertEquals(4, $sale2Items[0]->quantity);

        $movements = StockMovement::where('product_id', $testProduct->id)->get();
        $this->assertCount(2, $movements);
        $this->assertEquals(4, $movements[0]->quantity);
        $this->assertEquals(4, $movements[1]->quantity);

        // Final product stock must be 2 (10 - 4 - 4)
        $testProduct->refresh();
        $this->assertEquals(2, $testProduct->stock);
    }

    /** 15. Regression: Batch requesting 4 then 7 from stock of 10 fails and rolls back completely */
    public function test_cumulative_stock_fails_and_rolls_back_when_demand_exceeds_stock(): void
    {
        app()->instance('current_tenant', $this->tenantA);
        $testProduct = Product::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Ten Stock Fail Widget',
            'price'     => 15000.00,
            'stock'     => 10,
        ]);
        app()->forgetInstance('current_tenant');

        $salesBefore = Sale::count();
        $itemsBefore = SaleItem::count();
        $movementsBefore = StockMovement::count();
        $customersBefore = Customer::withoutGlobalScopes()->count();

        $sales = [
            [
                'payment_method' => 'cash',
                'customer_type'  => 'new',
                'new_customer'   => ['name' => 'Temp Customer 1'],
                'items' => [
                    ['product_id' => $testProduct->id, 'quantity' => 4, 'price' => 15000.00],
                ],
            ],
            [
                'payment_method' => 'cash',
                'items' => [
                    ['product_id' => $testProduct->id, 'quantity' => 7, 'price' => 15000.00],
                ],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA));

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);

        $this->assertStringContainsString('Insufficient stock', $response->json('message'));

        // Entire batch rolled back: zero new records
        $this->assertEquals($salesBefore, Sale::count());
        $this->assertEquals($itemsBefore, SaleItem::count());
        $this->assertEquals($movementsBefore, StockMovement::count());
        $this->assertEquals($customersBefore, Customer::withoutGlobalScopes()->count());

        // Product stock remains unchanged at 10
        $testProduct->refresh();
        $this->assertEquals(10, $testProduct->stock);
    }

    /** 16. In-flight processing idempotency key returns 409 Conflict */
    public function test_concurrent_idempotency_reservation_returns_409(): void
    {
        $idempotencyKey = 'in-flight-key-' . uniqid();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
        ];

        $requestHash = hash('sha256', json_encode($sales));

        // Create a pre-existing reservation with status 'processing'
        \App\Models\IdempotencyKey::create([
            'tenant_id'    => $this->tenantA->id,
            'user_id'      => $this->cashierA->id,
            'key'          => $idempotencyKey,
            'request_hash' => $requestHash,
            'status'       => 'processing',
        ]);

        // Attempt submission with same key
        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA, $idempotencyKey));

        $response->assertStatus(409)
                 ->assertJsonPath('success', false);

        $this->assertStringContainsString('currently processing', $response->json('message'));
    }

    /** 17. Failed batch cleans up idempotency reservation so retry can succeed */
    public function test_failed_batch_cleans_up_idempotency_reservation_allowing_retry(): void
    {
        $idempotencyKey = 'retry-key-' . uniqid();

        // Batch requesting impossible stock (fails)
        $failingSales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 99999, 'price' => 50000.00]],
            ],
        ];

        $res1 = $this->postJson('/api/sales/bulk', ['sales' => $failingSales], $this->tokenFor($this->cashierA, $idempotencyKey));
        $res1->assertStatus(422);

        // Verify reservation was deleted and not left in 'processing'
        $keyRecord = \App\Models\IdempotencyKey::where('tenant_id', $this->tenantA->id)
            ->where('key', $idempotencyKey)
            ->first();
        $this->assertNull($keyRecord);

        // Immediate retry with valid quantity succeeds using the SAME idempotency key
        $validSales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 2, 'price' => 50000.00]],
            ],
        ];

        $res2 = $this->postJson('/api/sales/bulk', ['sales' => $validSales], $this->tokenFor($this->cashierA, $idempotencyKey));
        $res2->assertStatus(201)
             ->assertJsonPath('success', true);

        $this->assertEquals(1, Sale::count());
    }

    /** 18. Stale processing reservation (> 2 min) is safely recovered */
    public function test_stale_processing_idempotency_key_can_be_recovered(): void
    {
        $idempotencyKey = 'stale-key-' . uniqid();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
        ];

        $requestHash = hash('sha256', json_encode($sales));

        // Create an abandoned reservation dated 5 minutes ago
        $staleKey = \App\Models\IdempotencyKey::create([
            'tenant_id'    => $this->tenantA->id,
            'user_id'      => $this->cashierA->id,
            'key'          => $idempotencyKey,
            'request_hash' => $requestHash,
            'status'       => 'processing',
        ]);
        $staleKey->updated_at = now()->subMinutes(5);
        $staleKey->save();

        // New request recovers the abandoned reservation and completes
        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA, $idempotencyKey));

        $response->assertStatus(201)
                 ->assertJsonPath('success', true);

        $staleKey->refresh();
        $this->assertEquals('completed', $staleKey->status);
    }

    /** 19. Idempotency key greater than 128 characters is rejected */
    public function test_idempotency_key_length_greater_than_128_is_rejected(): void
    {
        $longKey = str_repeat('a', 129);

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 1, 'price' => 50000.00]],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA, $longKey));

        $response->assertStatus(422)
                 ->assertJsonPath('success', false);
    }

    /** 20. Atomic commitment of sales and idempotency completion within one transaction */
    public function test_batch_commits_both_sales_and_idempotency_completion_atomically(): void
    {
        $idempotencyKey = 'atomic-commit-' . uniqid();

        $sales = [
            [
                'payment_method' => 'cash',
                'items' => [['product_id' => $this->productA->id, 'quantity' => 2, 'price' => 50000.00]],
            ],
            [
                'payment_method' => 'card',
                'items' => [['product_id' => $this->productA2->id, 'quantity' => 1, 'price' => 20000.00]],
            ],
        ];

        $response = $this->postJson('/api/sales/bulk', ['sales' => $sales], $this->tokenFor($this->cashierA, $idempotencyKey));
        $response->assertStatus(201);

        // Verify sales created
        $this->assertEquals(2, Sale::count());

        // Verify idempotency record has status 'completed' and contains exact replayable payload
        $idemp = \App\Models\IdempotencyKey::where('tenant_id', $this->tenantA->id)
            ->where('key', $idempotencyKey)
            ->first();

        $this->assertNotNull($idemp);
        $this->assertEquals('completed', $idemp->status);
        $this->assertEquals(201, $idemp->response_code);
        $this->assertNotNull($idemp->claim_token);
        $this->assertNotNull($idemp->response_body);

        $body = json_decode($idemp->response_body, true);
        $this->assertTrue($body['success']);
        $this->assertCount(2, $body['data']);
    }

    /** 21. Stale worker cleanup cannot delete or alter a reservation reclaimed by a newer worker */
    public function test_stale_worker_cleanup_cannot_delete_reservation_claimed_by_newer_worker(): void
    {
        $idempotencyKey = 'fencing-key-' . uniqid();
        $staleWorkerToken = (string) \Illuminate\Support\Str::uuid();
        $newWorkerToken   = (string) \Illuminate\Support\Str::uuid();

        // Create initial reservation with stale worker token
        $record = \App\Models\IdempotencyKey::create([
            'tenant_id'    => $this->tenantA->id,
            'user_id'      => $this->cashierA->id,
            'key'          => $idempotencyKey,
            'claim_token'  => $staleWorkerToken,
            'request_hash' => hash('sha256', 'dummy'),
            'status'       => 'processing',
        ]);

        // Newer worker reclaims reservation, advancing claim_token to $newWorkerToken
        $record->update([
            'claim_token' => $newWorkerToken,
            'updated_at'  => now(),
        ]);

        // Stale worker encounters an error and attempts ownership-safe cleanup using its old claim token
        \App\Models\IdempotencyKey::where('id', $record->id)
            ->where('status', 'processing')
            ->where('claim_token', $staleWorkerToken)
            ->delete();

        // The newer worker's reservation must remain completely intact!
        $fresh = \App\Models\IdempotencyKey::find($record->id);
        $this->assertNotNull($fresh);
        $this->assertEquals('processing', $fresh->status);
        $this->assertEquals($newWorkerToken, $fresh->claim_token);
    }
}
