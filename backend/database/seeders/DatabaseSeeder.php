<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create default/sample tenant
        $tenant = Tenant::firstOrCreate(
            ['email' => 'admin@zziwa.com'],
            [
                'name' => 'Zziwa and Sons Enterprises',
                'phone' => '+256 700 000000',
                'address' => 'Kampala, Uganda',
            ]
        );

        // 2. Create owner user
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Test User',
                'password' => Hash::make('password123'),
            ]
        );

        // 3. Assign owner role
        $ownerRole = Role::where('name', 'owner')->whereNull('tenant_id')->first();
        if ($ownerRole && !$user->roles()->where('roles.id', $ownerRole->id)->exists()) {
            $user->roles()->attach($ownerRole->id);
        }

        // 4. Attach all default permissions to the owner role
        if ($ownerRole) {
            $allPermissions = Permission::whereNull('tenant_id')->pluck('id');
            $ownerRole->permissions()->syncWithoutDetaching($allPermissions);
        }

        // 5. Seed sample categories
        if ($tenant->categories()->count() === 0) {
            $tenant->categories()->createMany([
                ['name' => 'Electronics', 'description' => 'Electronic components and devices'],
                ['name' => 'Hardware', 'description' => 'Tools, equipment and hardware supplies'],
                ['name' => 'General Merchandise', 'description' => 'Fast-moving consumer products'],
            ]);
        }

        // 6. Seed sample supplier
        if ($tenant->suppliers()->count() === 0) {
            $tenant->suppliers()->create([
                'name' => 'Apex General Supplies',
                'email' => 'supplies@apex.com',
                'contact' => '+256 750 123456',
                'address' => 'Industrial Area, Kampala',
            ]);
        }
    }
}
