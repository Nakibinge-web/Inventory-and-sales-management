<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('reports:generate-automated')->everyMinute();
Schedule::command('telemetry:prune')->daily();

Artisan::command('developer:grant {email : The user email to update} {--revoke : Remove the developer role instead of granting it}', function (string $email) {
    $user = \App\Models\User::where('email', $email)->first();

    if (!$user) {
        $this->error("No user found with email: {$email}");
        return 1;
    }

    $developerRole = \App\Models\Role::firstOrCreate(
        ['name' => 'developer', 'tenant_id' => null],
        [
            'description' => 'Platform Developer with cross-tenant monitoring and management privileges',
            'is_default'  => true,
        ]
    );

    if ($this->option('revoke')) {
        $user->roles()->detach($developerRole->id);
        $this->info("Revoked developer role from {$user->name} ({$user->email}).");
        return 0;
    }

    $developerPermissions = [
        ['name' => 'developer.portal.access',        'display_name' => 'Access Developer Portal'],
        ['name' => 'developer.telemetry.view',       'display_name' => 'View API Request Telemetry'],
        ['name' => 'developer.activity.view',        'display_name' => 'View System Activity Logs'],
        ['name' => 'developer.tenants.view',         'display_name' => 'View All Tenants'],
        ['name' => 'developer.tenants.manage',       'display_name' => 'Manage Tenants & Modules'],
        ['name' => 'developer.users.view',           'display_name' => 'View All Platform Users'],
        ['name' => 'developer.subscriptions.view',   'display_name' => 'View Tenant Subscriptions'],
        ['name' => 'developer.subscriptions.manage', 'display_name' => 'Manage Subscriptions & Quotas'],
        ['name' => 'developer.system_health.view',   'display_name' => 'View System Health & Diagnostics'],
    ];

    $permissionIds = [];
    foreach ($developerPermissions as $perm) {
        $record = \App\Models\Permission::firstOrCreate(
            ['name' => $perm['name'], 'tenant_id' => null],
            [
                'display_name' => $perm['display_name'],
                'group'        => 'developer',
                'is_default'   => true,
            ]
        );
        $permissionIds[] = $record->id;
    }

    $developerRole->permissions()->syncWithoutDetaching($permissionIds);
    $user->roles()->syncWithoutDetaching([$developerRole->id]);

    $this->info("Granted developer role and developer permissions to {$user->name} ({$user->email}).");
    return 0;
})->purpose('Grant (or revoke) the platform developer role and permissions for a user');

