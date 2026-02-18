<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Http\Controllers\Concerns\ApiResponse;

class PermissionController extends Controller
{
    use ApiResponse;
    public function index(Request $request)
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 20)));
        return $this->success(Permission::query()->paginate($perPage));
    }

    public function show(Permission $permission)
    {
        return $this->success($permission);
    }

    public function store(StorePermissionRequest $request)
    {
        $data = $request->validated();
        $permission = Permission::create(['name' => $data['name']]);
        return $this->success($permission, 'Permission created', 201);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $data = $request->validated();
        $permission->name = $data['name'];
        $permission->save();
        return $this->success($permission, 'Permission updated');
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return $this->success(null, 'Permission deleted', 204);
    }
}


