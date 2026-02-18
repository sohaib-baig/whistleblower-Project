<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all departments
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = Department::query();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        // Search filter
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Status filter
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Sorting
        $allowedSorts = ['name', 'status', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        }

        // Company-specific filtering
        if ($this->isCompanyUser($user, $roleColumn)) {
            $query->where('company_id', $user->id);
        } elseif ($this->isAdminUser($user, $roleColumn) && $request->filled('company_id')) {
            $query->where('company_id', $request->string('company_id')->toString());
        }

        $departments = $query->paginate($perPage);

        return $this->success($departments);
    }

    /**
     * Show a specific department
     */
    public function show(Request $request, Department $department): JsonResponse
    {
        if (!$this->canAccessDepartment($request, $department)) {
            return $this->error('Unauthorized. You cannot access this department.', 403);
        }

        return $this->success($department);
    }

    /**
     * Create a new department
     */
    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        $department = new Department();
        $department->name = $data['name'];
        $department->status = $data['status'] ?? 'active';
        $department->company_id = $this->isCompanyUser($user, $roleColumn)
            ? $user->id
            : ($data['company_id'] ?? null);
        $department->save();

        app(AuditLogger::class)->log($request, 'department.created', 'Department', $department->id, [
            'name' => $department->name,
            'status' => $department->status,
            'company_id' => $department->company_id,
        ]);

        return $this->success($department, 'Department created successfully', 201);
    }

    /**
     * Update an existing department
     */
    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        if (!$this->canAccessDepartment($request, $department)) {
            return $this->error('Unauthorized. You cannot update this department.', 403);
        }

        $data = $request->validated();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        $oldData = $department->only(['name', 'status', 'company_id']);

        foreach (['name', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $department->{$field} = $data[$field];
            }
        }

        if (!$this->isCompanyUser($user, $roleColumn) && array_key_exists('company_id', $data)) {
            $department->company_id = $data['company_id'];
        }

        if ($this->isCompanyUser($user, $roleColumn)) {
            $department->company_id = $user->id;
        }

        $department->save();
        $newData = $department->only(['name', 'status', 'company_id']);
        $changes = array_diff_assoc($newData, $oldData);

        app(AuditLogger::class)->log($request, 'department.updated', 'Department', $department->id, [
            'changes' => $changes,
        ]);

        return $this->success($department, 'Department updated successfully');
    }

    /**
     * Delete a department (soft delete)
     */
    public function destroy(Request $request, Department $department): JsonResponse
    {
        if (!$this->canAccessDepartment($request, $department)) {
            return $this->error('Unauthorized. Only admins or owning company users can delete this department.', 403);
        }

        $departmentData = $department->only(['name', 'status', 'company_id']);
        $department->delete();

        app(AuditLogger::class)->log($request, 'department.deleted', 'Department', $department->id, $departmentData);

        return $this->success(null, 'Department deleted successfully', 204);
    }

    /**
     * Determine whether the current user can access a specific department.
     */
    protected function canAccessDepartment(Request $request, Department $department): bool
    {
        $user = $request->user();

        if (!$user) {
            return false;
        }

        $user->loadMissing('roles');
        $roleColumn = $user->role ?? null;

        if ($this->isAdminUser($user, $roleColumn)) {
            return true;
        }

        if ($this->isCompanyUser($user, $roleColumn)) {
            return $department->company_id === $user->id;
        }

        return $user->can('departments.manage') || $user->can('departments.view');
    }

    protected function isAdminUser($user, ?string $roleColumn = null): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->hasRole('admin') || $roleColumn === 'admin') {
            return true;
        }

        return $user->can('departments.manage');
    }

    protected function isCompanyUser($user, ?string $roleColumn = null): bool
    {
        if (!$user) {
            return false;
        }

        return $user->hasRole('company') || $roleColumn === 'company';
    }
}

