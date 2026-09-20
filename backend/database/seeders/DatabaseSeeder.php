<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['email' => 'admin@zziwa.com'],
            [
                'name' => 'Zziwa and Sons Enterprises',
                'phone' => '+256 700 000000',
                'address' => 'Kampala, Uganda',
            ]
        );

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Test User',
                'password' => Hash::make('password123'),
            ]
        );

        $ownerRole = Role::where('name', 'owner')->whereNull('tenant_id')->first();
        if ($ownerRole && !$user->roles()->where('roles.id', $ownerRole->id)->exists()) {
            $user->roles()->attach($ownerRole->id);
        }

        if ($tenant->categories()->count() === 0) {
            $tenant->categories()->createMany([
                ['name' => 'Electronics', 'description' => 'Electronic components and devices'],
                ['name' => 'Hardware', 'description' => 'Tools, equipment and hardware supplies'],
                ['name' => 'General Merchandise', 'description' => 'Fast-moving consumer products'],
            ]);
        }

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
