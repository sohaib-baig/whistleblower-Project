<?php

namespace App\Http\Controllers;

use App\Models\State;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\State\StoreStateRequest;
use App\Http\Requests\State\UpdateStateRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class StateController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all states
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = State::query();
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

        $states = $query->paginate($perPage);

        return $this->success($states);
    }

    /**
     * Show a specific state
     */
    public function show(Request $request, State $state): JsonResponse
    {
        if (!$this->canAccessState($request, $state)) {
            return $this->error('Unauthorized. You cannot access this state.', 403);
        }

        return $this->success($state);
    }

    /**
     * Create a new state
     */
    public function store(StoreStateRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        $state = new State();
        $state->name = $data['name'];
        $state->status = $data['status'] ?? 'active';
        $state->company_id = $this->isCompanyUser($user, $roleColumn)
            ? $user->id
            : ($data['company_id'] ?? null);
        $state->save();

        app(AuditLogger::class)->log($request, 'state.created', 'State', $state->id, [
            'name' => $state->name,
            'status' => $state->status,
            'company_id' => $state->company_id,
        ]);

        return $this->success($state, 'State created successfully', 201);
    }

    /**
     * Update an existing state
     */
    public function update(UpdateStateRequest $request, State $state): JsonResponse
    {
        if (!$this->canAccessState($request, $state)) {
            return $this->error('Unauthorized. You cannot update this state.', 403);
        }

        $data = $request->validated();
        $user = $request->user();
        $roleColumn = null;

        if ($user) {
            $user->loadMissing('roles');
            $roleColumn = $user->role ?? null;
        }

        $oldData = $state->only(['name', 'status', 'company_id']);

        foreach (['name', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $state->{$field} = $data[$field];
            }
        }

        if (!$this->isCompanyUser($user, $roleColumn) && array_key_exists('company_id', $data)) {
            $state->company_id = $data['company_id'];
        }

        if ($this->isCompanyUser($user, $roleColumn)) {
            $state->company_id = $user->id;
        }

        $state->save();
        $newData = $state->only(['name', 'status', 'company_id']);
        $changes = array_diff_assoc($newData, $oldData);

        app(AuditLogger::class)->log($request, 'state.updated', 'State', $state->id, [
            'changes' => $changes,
        ]);

        return $this->success($state, 'State updated successfully');
    }

    /**
     * Delete a state (soft delete)
     */
    public function destroy(Request $request, State $state): JsonResponse
    {
        if (!$this->canAccessState($request, $state)) {
            return $this->error('Unauthorized. Only admins or owning company users can delete this state.', 403);
        }

        $stateData = $state->only(['name', 'status', 'company_id']);
        $state->delete();

        app(AuditLogger::class)->log($request, 'state.deleted', 'State', $state->id, $stateData);

        return $this->success(null, 'State deleted successfully', 204);
    }

    /**
     * Determine whether the current user can access a specific state.
     */
    protected function canAccessState(Request $request, State $state): bool
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
            return $state->company_id === $user->id;
        }

        return $user->can('states.manage') || $user->can('states.view');
    }

    protected function isAdminUser($user, ?string $roleColumn = null): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->hasRole('admin') || $roleColumn === 'admin') {
            return true;
        }

        return $user->can('states.manage');
    }

    protected function isCompanyUser($user, ?string $roleColumn = null): bool
    {
        if (!$user) {
            return false;
        }

        return $user->hasRole('company') || $roleColumn === 'company';
    }
}

