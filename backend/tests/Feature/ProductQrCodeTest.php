<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductQrCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_can_be_created_with_qr_code_and_switched_between_barcode_and_qr_code(): void
    {
        $tenant = Tenant::create([
            'name'                    => 'QR Store',
            'email'                   => 'qr_' . uniqid() . '@example.com',
            'subscription_plan'       => 'trial',
            'subscription_status'     => 'trial',
            'subscription_expires_at' => now()->addDays(14),
        ]);

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name'      => 'QR Owner',
            'email'     => 'qrowner_' . uniqid() . '@example.com',
            'username'  => 'qrowner_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $owner->roles()->attach($ownerRole->id);

        $this->actingAs($owner, 'sanctum');

        $createRes = $this->postJson('/api/products', [
            'name'      => 'Artisan Coffee Beans 1kg',
            'code_type' => 'qr_code',
            'barcode'   => null,
            'qr_code'   => 'QR-COFFEE-001',
            'unit'      => 'Kilograms (kg)',
            'stock'     => 15,
            'price'     => 45000,
        ]);

        $createRes->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.code_type', 'qr_code')
            ->assertJsonPath('data.qr_code', 'QR-COFFEE-001')
            ->assertJsonPath('data.barcode', null);

        $productId = $createRes->json('data.id');

        $updateRes = $this->putJson("/api/products/{$productId}", [
            'code_type' => 'barcode',
            'barcode'   => '8901234567890',
            'qr_code'   => '',
        ]);

        $updateRes->assertOk()
            ->assertJsonPath('data.code_type', 'barcode')
            ->assertJsonPath('data.barcode', '8901234567890')
            ->assertJsonPath('data.qr_code', null);

        $this->assertDatabaseHas('products', [
            'id'        => $productId,
            'code_type' => 'barcode',
            'barcode'   => '8901234567890',
            'qr_code'   => null,
        ]);
    }

    public function test_lookup_code_returns_matching_products_from_database_with_tenant_isolation(): void
    {
        $tenantA = Tenant::create([
            'name'                    => 'Tenant A Store',
            'email'                   => 'tA_' . uniqid() . '@example.com',
            'subscription_plan'       => 'trial',
            'subscription_status'     => 'trial',
            'subscription_expires_at' => now()->addDays(14),
        ]);
        $tenantB = Tenant::create([
            'name'                    => 'Tenant B Store',
            'email'                   => 'tB_' . uniqid() . '@example.com',
            'subscription_plan'       => 'trial',
            'subscription_status'     => 'trial',
            'subscription_expires_at' => now()->addDays(14),
        ]);

        $ownerRole = Role::firstOrCreate(
            ['name' => 'owner', 'tenant_id' => null],
            ['description' => 'Owner', 'is_default' => true]
        );

        $ownerA = User::create([
            'tenant_id' => $tenantA->id,
            'name'      => 'Owner A',
            'email'     => 'ownera_' . uniqid() . '@example.com',
            'username'  => 'ownera_' . uniqid(),
            'password'  => Hash::make('Password1!'),
            'is_active' => true,
        ]);
        $ownerA->roles()->attach($ownerRole->id);

        // Create two products in Tenant A sharing a batch QR code, one barcoded product, and one Tenant B product with the same QR code
        Product::create([
            'tenant_id' => $tenantA->id,
            'name'      => 'Roast Pack Small',
            'sku'       => 'RST-S',
            'qr_code'   => 'QR-BATCH-77',
            'code_type' => 'qr_code',
            'stock'     => 10,
            'price'     => 15000,
        ]);
        Product::create([
            'tenant_id' => $tenantA->id,
            'name'      => 'Roast Pack Large',
            'sku'       => 'RST-L',
            'qr_code'   => 'QR-BATCH-77',
            'code_type' => 'qr_code',
            'stock'     => 5,
            'price'     => 28000,
        ]);
        Product::create([
            'tenant_id' => $tenantA->id,
            'name'      => 'Sunflower Oil 1L',
            'sku'       => 'OIL-1L',
            'barcode'   => '6001234567895',
            'code_type' => 'barcode',
            'stock'     => 12,
            'price'     => 19000,
        ]);
        Product::create([
            'tenant_id' => $tenantB->id,
            'name'      => 'Other Tenant Secret Item',
            'sku'       => 'SEC-1',
            'qr_code'   => 'QR-BATCH-77',
            'code_type' => 'qr_code',
            'stock'     => 99,
            'price'     => 99000,
        ]);

        $this->actingAs($ownerA, 'sanctum');

        // Multi-product QR code match returns all matching Tenant A products (and excludes Tenant B)
        $qrRes = $this->getJson('/api/products/lookup-code?code=QR-BATCH-77&code_type=qr_code');
        $qrRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('count', 2)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Roast Pack Small')
            ->assertJsonPath('data.1.name', 'Roast Pack Large');

        // Single barcode match with trailing control char stripped
        $barRes = $this->getJson('/api/products/lookup-code?code=' . urlencode("6001234567895\r") . '&code_type=barcode');
        $barRes->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('data.0.name', 'Sunflower Oil 1L');

        // Unknown code returns empty data array
        $missRes = $this->getJson('/api/products/lookup-code?code=DOES-NOT-EXIST');
        $missRes->assertOk()
            ->assertJsonPath('count', 0)
            ->assertJsonCount(0, 'data');
    }
}
