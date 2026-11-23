<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    private function createOwner(): array
    {
        $tenant = Tenant::create([
            'name'                => 'Category Test Business',
            'email'               => 'catbiz_' . uniqid() . '@example.com',
            'subscription_plan'   => 'trial',
            'subscription_status' => 'trial',
            'subscription_expires_at' => now()->addDays(14),
        ]);

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Owner User',
            'email'     => 'catowner_' . uniqid() . '@example.com',
            'username'  => 'catowner_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);

        $owner->roles()->attach($ownerRole->id);

        return [$owner, $tenant];
    }

    public function test_index_and_show_include_product_counts_and_products_in_category(): void
    {
        [$owner, $tenant] = $this->createOwner();

        $cat1 = Category::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Smartphones',
            'description' => 'Mobile devices',
        ]);
        $cat2 = Category::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Accessories',
            'description' => 'Chargers and cables',
        ]);

        Product::create([
            'tenant_id'     => $tenant->id,
            'category_id'   => $cat1->id,
            'name'          => 'Samsung Galaxy A54',
            'sku'           => 'SAM-A54',
            'stock'         => 10,
            'price'         => 980000,
            'reorder_level' => 3,
        ]);
        Product::create([
            'tenant_id'     => $tenant->id,
            'category_id'   => $cat1->id,
            'name'          => 'Xiaomi Redmi Note 13',
            'sku'           => 'XIA-RN13',
            'stock'         => 5,
            'price'         => 760000,
            'reorder_level' => 2,
        ]);
        Product::create([
            'tenant_id'     => $tenant->id,
            'category_id'   => $cat2->id,
            'name'          => 'USB-C Cable',
            'sku'           => 'USB-01',
            'stock'         => 25,
            'price'         => 25000,
            'reorder_level' => 5,
        ]);

        $this->actingAs($owner, 'sanctum');

        $indexRes = $this->getJson('/api/categories');
        $indexRes->assertOk()->assertJsonPath('success', true);
        $indexData = collect($indexRes->json('data'))->keyBy('id');
        $this->assertSame(2, $indexData[$cat1->id]['products_count']);
        $this->assertSame(1, $indexData[$cat2->id]['products_count']);

        $showRes = $this->getJson("/api/categories/{$cat1->id}");
        $showRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.products_count', 2)
            ->assertJsonCount(2, 'data.products');

        $productNames = collect($showRes->json('data.products'))->pluck('name')->all();
        $this->assertEqualsCanonicalizing(['Samsung Galaxy A54', 'Xiaomi Redmi Note 13'], $productNames);

        $storeRes = $this->postJson('/api/categories', [
            'name'        => 'Beverages',
            'description' => 'Soft drinks',
        ]);
        $storeRes->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.products_count', 0);
    }
}
