<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReportAutomationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permission = [
            'name' => 'reports.configure_automation',
            'display_name' => 'Configure Automated Reports',
            'group' => 'reports',
            'tenant_id' => null,
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if (!Permission::where('name', $permission['name'])->exists()) {
            DB::table('permissions')->insert($permission);
            $this->command->info('✅ Seeded permission: reports.configure_automation');
            
            // Optionally add to owner role
            $ownerRole = Role::where('name', 'owner')->whereNull('tenant_id')->first();
            if ($ownerRole) {
                $permId = DB::table('permissions')->where('name', $permission['name'])->first()->id;
                DB::table('permission_role')->insert([
                    'permission_id' => $permId,
                    'role_id' => $ownerRole->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
