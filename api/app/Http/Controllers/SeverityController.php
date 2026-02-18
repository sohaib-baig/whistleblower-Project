<?php

namespace App\Http\Controllers;

use App\Models\Severity;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Severity\StoreSeverityRequest;
use App\Http\Requests\Severity\UpdateSeverityRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class SeverityController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all severities
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = Severity::query();
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

        if ($this->isCompanyUser($user, $roleColumn)) {
            $query->where('company_id', $user->id);
        } elseif ($this->isAdminUser($user, $roleColumn) && $request->filled('company_id')) {
            $query->where('company_id', $request->string('company_id')->toString());
        }

        $severities = $query->paginate($perPage);

        return $this->success($severities);
    }

    /**
     * Show a specific severity
     */
    public function show(Request $request, Severity $severity): JsonResponse
    {
        if (!$this->canAccessSeverity($request, $severity)) {
            return $this->error('Unauthorized. You cannot access this severity.', 403);
        }

        return $this->success($severity);
    }

    /**
     * Create a new severity
     */
    public function store(StoreSeverityRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        $severity = new Severity();
        $severity->name = $data['name'];
        $severity->status = $data['status'] ?? 'active';
        $severity->company_id = $this->isCompanyUser($user, $roleColumn)
            ? $user->id
            : ($data['company_id'] ?? null);
        $severity->save();

        app(AuditLogger::class)->log($request, 'severity.created', 'Severity', $severity->id, [
            'name' => $severity->name,
            'status' => $severity->status,
            'company_id' => $severity->company_id,
        ]);

        return $this->success($severity, 'Severity created successfully', 201);
    }

    /**
     * Update an existing severity
     */
    public function update(UpdateSeverityRequest $request, Severity $severity): JsonResponse
    {
        if (!$this->canAccessSeverity($request, $severity)) {
            return $this->error('Unauthorized. You cannot update this severity.', 403);
        }

        $data = $request->validated();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        $oldData = $severity->only(['name', 'status', 'company_id']);

        foreach (['name', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $severity->{$field} = $data[$field];
            }
        }

        if (!$this->isCompanyUser($user, $roleColumn) && array_key_exists('company_id', $data)) {
            $severity->company_id = $data['company_id'];
        }

        if ($this->isCompanyUser($user, $roleColumn)) {
            $severity->company_id = $user->id;
        }

        $severity->save();
        $newData = $severity->only(['name', 'status', 'company_id']);
        $changes = array_diff_assoc($newData, $oldData);

        app(AuditLogger::class)->log($request, 'severity.updated', 'Severity', $severity->id, [
            'changes' => $changes,
        ]);

        return $this->success($severity, 'Severity updated successfully');
    }

    /**
     * Delete a severity (soft delete)
     */
    public function destroy(Request $request, Severity $severity): JsonResponse
    {
        if (!$this->canAccessSeverity($request, $severity)) {
            return $this->error('Unauthorized. Only admins or owning company users can delete this severity.', 403);
        }

        $severityData = $severity->only(['name', 'status', 'company_id']);
        $severity->delete();

        app(AuditLogger::class)->log($request, 'severity.deleted', 'Severity', $severity->id, $severityData);

        return $this->success(null, 'Severity deleted successfully', 204);
    }

    /**
     * Determine whether the current user can access a specific severity.
     */
    protected function canAccessSeverity(Request $request, Severity $severity): bool
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
            return $severity->company_id === $user->id;
        }

        return $user->can('severities.manage') || $user->can('severities.view');
    }

    protected function isAdminUser($user, ?string $roleColumn = null): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->hasRole('admin') || $roleColumn === 'admin') {
            return true;
        }

        return $user->can('severities.manage');
    }

    protected function isCompanyUser($user, ?string $roleColumn = null): bool
    {
        if (!$user) {
            return false;
        }

        return $user->hasRole('company') || $roleColumn === 'company';
    }
}

