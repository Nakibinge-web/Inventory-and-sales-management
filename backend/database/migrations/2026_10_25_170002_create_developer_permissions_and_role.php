<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create developer role if not exists
        $roleId = DB::table('roles')->where('name', 'developer')->whereNull('tenant_id')->value('id');
        if (!$roleId) {
            $roleId = DB::table('roles')->insertGetId([
                'tenant_id' => null,
                'name' => 'developer',
                'description' => 'Platform Developer with cross-tenant monitoring and management privileges',
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Define developer permissions
        $permissions = [
            ['name' => 'developer.portal.access',       'display_name' => 'Access Developer Portal',          'group' => 'developer'],
            ['name' => 'developer.telemetry.view',      'display_name' => 'View API Request Telemetry',       'group' => 'developer'],
            ['name' => 'developer.activity.view',       'display_name' => 'View System Activity Logs',        'group' => 'developer'],
            ['name' => 'developer.tenants.view',        'display_name' => 'View All Tenants',                'group' => 'developer'],
            ['name' => 'developer.tenants.manage',      'display_name' => 'Manage Tenants & Modules',         'group' => 'developer'],
            ['name' => 'developer.users.view',          'display_name' => 'View All Platform Users',          'group' => 'developer'],
            ['name' => 'developer.subscriptions.view',  'display_name' => 'View Tenant Subscriptions',        'group' => 'developer'],
            ['name' => 'developer.subscriptions.manage','display_name' => 'Manage Subscriptions & Quotas',   'group' => 'developer'],
            ['name' => 'developer.system_health.view',  'display_name' => 'View System Health & Diagnostics', 'group' => 'developer'],
        ];

        foreach ($permissions as $perm) {
            $existing = DB::table('permissions')
                ->where('name', $perm['name'])
                ->whereNull('tenant_id')
                ->first();

            $permId = $existing ? $existing->id : DB::table('permissions')->insertGetId([
                'tenant_id' => null,
                'name' => $perm['name'],
                'display_name' => $perm['display_name'],
                'group' => $perm['group'],
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign permission to developer role if not already attached
            $attached = DB::table('permission_role')
                ->where('permission_id', $permId)
                ->where('role_id', $roleId)
                ->exists();

            if (!$attached) {
                DB::table('permission_role')->insert([
                    'permission_id' => $permId,
                    'role_id' => $roleId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $role = DB::table('roles')->where('name', 'developer')->whereNull('tenant_id')->first();
        if ($role) {
            DB::table('permission_role')->where('role_id', $role->id)->delete();
            DB::table('role_user')->where('role_id', $role->id)->delete();
            DB::table('roles')->where('id', $role->id)->delete();
        }

        DB::table('permissions')->where('group', 'developer')->whereNull('tenant_id')->delete();
    }
};
