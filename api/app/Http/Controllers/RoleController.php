<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Services\AuditLogger;

class RoleController extends Controller
{
    use ApiResponse;
    public function index(Request $request)
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $roles = Role::where('name', '!=', 'admin')->with('permissions')->paginate($perPage);
        
        // Add permission count and module count (unique prefixes before first dot) to each role
        $roles->getCollection()->transform(function ($role) {
            $role->permissions_count = $role->permissions->count();
            $modules = $role->permissions->pluck('name')
                ->map(function ($name) {
                    $parts = explode('.', (string) $name, 2);
                    return trim((string) ($parts[0] ?? ''));
                })
                ->filter(fn ($m) => $m !== '')
                ->unique()
                ->values();
            $role->module_count = $modules->count();
            return $role;
        });
        
        return $this->success($roles);
    }

    public function show(Role $role)
    {
        return $this->success($role->load('permissions'));
    }

    public function edit(Role $role)
    {
        // Get role with filtered permissions (only specific modules)
        $allowedModules = ['reports', 'manual_entries'];
        $allPermissions = Permission::query()
            ->where(function ($q) use ($allowedModules) {
                foreach ($allowedModules as $mod) {
                    $q->orWhere('name', 'like', $mod . '.%');
                    $q->orWhere('name', $mod);
                }
            })
            ->get();
        $role->load('permissions'); // Ensure permissions are loaded
        $rolePermissions = $role->permissions->pluck('id')->toArray();
        
        $permissions = $allPermissions->map(function ($permission) use ($rolePermissions) {
            $assigned = in_array($permission->id, $rolePermissions);
            return [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
                'assigned' => $assigned,
                'created_at' => $permission->created_at,
                'updated_at' => $permission->updated_at,
            ];
        });

        return $this->success([
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ],
            'permissions' => $permissions,
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        $data = $request->validated();
        $role = Role::create(['name' => $data['name']]);
        if (!empty($data['permissions'])) {
            $perms = Permission::whereIn('name', $data['permissions'])->get();
            $role->syncPermissions($perms);
        }
        
        app(AuditLogger::class)->log($request, 'role.created', 'Role', $role->id, [
            'role_name' => $role->name,
            'permissions_count' => $role->permissions->count(),
        ]);
        
        return $this->success($role->load('permissions'), 'Role created', 201);
    }

    public function update(UpdateRoleRequest $request, Role $role)
    {
        $data = $request->validated();
        $oldData = $role->only(['name']);
        $oldPermissions = $role->permissions->pluck('name')->toArray();
        
        if (array_key_exists('name', $data)) {
            $role->name = $data['name'];
            $role->save();
        }
        if (array_key_exists('permissions', $data)) {
            $perms = Permission::whereIn('name', $data['permissions'] ?? [])->get();
            $role->syncPermissions($perms);
        }
        
        $newPermissions = $role->fresh()->permissions->pluck('name')->toArray();
        $permissionChanges = [
            'added' => array_diff($newPermissions, $oldPermissions),
            'removed' => array_diff($oldPermissions, $newPermissions),
        ];
        
        app(AuditLogger::class)->log($request, 'role.updated', 'Role', $role->id, [
            'role_name' => $role->name,
            'changes' => array_diff_assoc($data, $oldData),
            'permission_changes' => $permissionChanges,
        ]);
        
        return $this->success($role->load('permissions'), 'Role updated');
    }

    public function updatePermissions(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $oldPermissions = $role->permissions->pluck('name')->toArray();
        $permissionIds = $request->input('permissions', []);
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $role->syncPermissions($permissions);
        
        $newPermissions = $role->fresh()->permissions->pluck('name')->toArray();
        $permissionChanges = [
            'added' => array_diff($newPermissions, $oldPermissions),
            'removed' => array_diff($oldPermissions, $newPermissions),
        ];

        app(AuditLogger::class)->log($request, 'role.permissions.updated', 'Role', $role->id, [
            'role_name' => $role->name,
            'permission_changes' => $permissionChanges,
        ]);

        return $this->success([
            'role' => $role->fresh(),
            'permissions' => $role->permissions,
        ], 'Role permissions updated');
    }

    public function destroy(Request $request, Role $role)
    {
        $roleData = $role->only(['name']);
        $permissions = $role->permissions->pluck('name')->toArray();
        $role->delete();
        
        app(AuditLogger::class)->log($request, 'role.deleted', 'Role', $role->id, [
            'role_name' => $roleData['name'],
            'permissions_count' => count($permissions),
        ]);
        
        return $this->success(null, 'Role deleted', 204);
    }
}


