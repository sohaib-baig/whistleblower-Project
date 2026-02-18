<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Permissions to grant to the company role.
     *
     * @var array<int, string>
     */
    protected array $permissions = [
        'departments.manage',
        'departments.view',
        'departments.create',
        'departments.update',
        'departments.delete',
        'states.manage',
        'states.view',
        'states.create',
        'states.update',
        'states.delete',
        'severities.manage',
        'severities.view',
        'severities.create',
        'severities.update',
        'severities.delete',
    ];

    public function up(): void
    {
        $companyRole = Role::where('name', 'company')->first();

        if (!$companyRole) {
            return;
        }

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = Permission::whereIn('name', $this->permissions)->get();

        foreach ($permissions as $permission) {
            if (!$companyRole->hasPermissionTo($permission)) {
                $companyRole->givePermissionTo($permission);
            }
        }
    }

    public function down(): void
    {
        $companyRole = Role::where('name', 'company')->first();

        if (!$companyRole) {
            return;
        }

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($this->permissions as $permissionName) {
            if ($companyRole->hasPermissionTo($permissionName)) {
                $companyRole->revokePermissionTo($permissionName);
            }
        }
    }
};

