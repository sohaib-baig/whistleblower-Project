<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ManualEntry;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeSetPasswordMail;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $role = strtolower($request->string('role')->toString());
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();
        $query = User::with('roles');
        // Exclude users with admin role
        $query->whereDoesntHave('roles', function($q) {
            $q->where('name', 'admin');
        });
        // Search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        // Role filter
        if ($role) {
            $query->whereHas('roles', function($q) use ($role) {
                $q->where('name', $role);
            });
        }
        // Status filter
        if ($status !== 'all') {
            switch ($status) {
                case 'active':
                    $query->where('is_active', 1);
                    break;
                case 'pending':
                    $query->where('is_active', 2);
                    break;
                case 'banned':
                    $query->where('is_active', 0);
                    break;
            }
        }
        // Sorting
        $allowedSorts = ['name', 'email', 'company', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        } elseif ($sort === 'phoneNumber') {
            $query->orderBy('phone', $order);
        } elseif ($sort === 'role') {
            $query->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
                  ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                  ->orderBy('roles.name', $order)
                  ->select('users.*');
        } elseif ($sort === 'status') {
            $query->orderBy('is_active', $order);
        }
        $users = $query->paginate($perPage);
        // Transform data to include role information
        $users->getCollection()->transform(function ($user) {
            $user->role_names = $user->roles->pluck('name')->toArray();
            $user->primary_role = $user->roles->first()?->name ?? 'No Role';
            return $user;
        });
        return $this->success($users);
    }

    public function assignRole(Request $request, User $user)
    {
        $this->authorize('update', $user);
        // Normalize role to lowercase before validation to allow 'Admin' or 'admin'
        $roleName = strtolower($request->string('role')->toString());
        $request->merge(['role' => $roleName]);
        $request->validate(['role' => ['required','string','exists:roles,name']]);
        $user->assignRole($roleName);
        
        app(AuditLogger::class)->log($request, 'user.role.assigned', 'User', $user->id, [
            'user_email' => $user->email,
            'role' => $roleName,
        ]);
        
        return $this->success($user->load('roles'), 'Role assigned');
    }

    public function removeRole(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $roleName = strtolower($request->string('role')->toString());
        $request->merge(['role' => $roleName]);
        $request->validate(['role' => ['required','string','exists:roles,name']]);
        $user->removeRole($roleName);
        
        app(AuditLogger::class)->log($request, 'user.role.removed', 'User', $user->id, [
            'user_email' => $user->email,
            'role' => $roleName,
        ]);
        
        return $this->success($user->load('roles'), 'Role removed');
    }

    public function assignPermission(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $request->validate(['permission' => ['required','string','exists:permissions,name']]);
        $permission = $request->string('permission');
        $user->givePermissionTo($permission);
        
        app(AuditLogger::class)->log($request, 'user.permission.assigned', 'User', $user->id, [
            'user_email' => $user->email,
            'permission' => $permission,
        ]);
        
        return $this->success($user->load('permissions'), 'Permission assigned');
    }

    public function removePermission(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $request->validate(['permission' => ['required','string','exists:permissions,name']]);
        $permission = $request->string('permission');
        $user->revokePermissionTo($permission);
        
        app(AuditLogger::class)->log($request, 'user.permission.removed', 'User', $user->id, [
            'user_email' => $user->email,
            'permission' => $permission,
        ]);
        
        return $this->success($user->load('permissions'), 'Permission removed');
    }

    public function show(User $user)
    {
        $this->authorize('view', $user);
        return $this->success($user->load(['roles', 'permissions']));
    }

    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);
        $data = $request->validated();
        $user = new User();
        // Optional profile fields
        foreach (['name','email','phone','country','timezone','address','state','city','zip_code','about','company','traffic_source'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
            }
        }
        // is_active: 0=banned, 1=active, 2=pending (default on create)
        if (array_key_exists('is_active', $data)) {
            $incoming = $data['is_active'];
            if (is_bool($incoming)) {
                // Backward-compat: true => 1 (active), false => 2 (pending)
                $user->is_active = $incoming ? 1 : 2;
            } else {
                $code = (int) $incoming;
                $user->is_active = in_array($code, [0,1,2], true) ? $code : 2;
            }
        } else {
            // Default to pending on create
            $user->is_active = 2;
        }
        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_path = $path;
        }
        $user->save();
        if (!empty($data['role'])) {
            $role = Role::where('name', strtolower($data['role']))->first();
            if ($role) {
                $user->assignRole($role);
            }
        }
        // Send welcome email with set password link (first-time setup)
        try {
            $token = Password::broker('welcome')->createToken($user);
            $frontendBase = rtrim((string) (config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url')), '/');
            $setPasswordUrl = $frontendBase.'/auth/set-password?token='.$token.'&email='.urlencode($user->email);
            Mail::to($user->email)->queue((new WelcomeSetPasswordMail($user, $setPasswordUrl))->delay(now()->addSeconds(30)));
        } catch (\Throwable $e) {
            Log::warning('Failed to send welcome password setup email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage()
            ]);
        }
        // Attach avatar_url for consumers
        $user->avatar_url = $user->avatar_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar_path) : null;
        
        app(AuditLogger::class)->log($request, 'user.created', 'User', $user->id, [
            'user_email' => $user->email,
            'user_name' => $user->name,
            'is_active' => $user->is_active,
            'role' => $data['role'] ?? null,
        ]);
        
        return $this->success($user->load(['roles','permissions']), 'User created', 201);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);
        $data = $request->validated();
        $oldData = $user->only(['name', 'email', 'is_active']);
        // Handle is_active mapping if provided
        if (array_key_exists('is_active', $data)) {
            $incoming = $data['is_active'];
            if (is_bool($incoming)) {
                $user->is_active = $incoming ? 1 : 2;
            } else {
                $code = (int) $incoming;
                $user->is_active = in_array($code, [0,1,2], true) ? $code : $user->is_active;
            }
        }
        // Email verification can promote pending (2) to active (1)
        if (array_key_exists('is_verified', $data)) {
            $user->email_verified_at = $data['is_verified'] ? now() : null;
            if ($data['is_verified'] && (int) $user->is_active === 2) {
                $user->is_active = 1;
            }
        }
        // Optional profile fields (note: map 'company' request field to 'company_name' column)
        foreach (['name','phone','phone_hours_from','phone_hours_to','phone_hours_format','email','country','timezone','address','physical_address','state','city','zip_code','about','traffic_source','user_language','company_number'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = $data[$field];
            }
        }
        if (array_key_exists('company', $data)) {
            $user->company_name = $data['company'];
        }
        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_path = $path;
        }
        $user->save();
        if (array_key_exists('role', $data)) {
            if ($data['role']) {
                $role = Role::where('name', strtolower($data['role']))->first();
                if ($role) {
                    $user->syncRoles([$role]);
                }
            } else {
                $user->syncRoles([]);
            }
        }
        
        app(AuditLogger::class)->log($request, 'user.updated', 'User', $user->id, [
            'user_email' => $user->email,
            'changes' => array_diff_assoc($data, $oldData),
        ]);
        
        // Attach avatar_url for consumers
        $user->avatar_url = $user->avatar_path ? \Illuminate\Support\Facades\Storage::url($user->avatar_path) : null;

        return $this->success($user->load(['roles','permissions']), 'User updated');
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorize('delete', $user);
        
        $userData = $user->only(['name', 'email']);
        $user->delete();
        
        app(AuditLogger::class)->log($request, 'user.deleted', 'User', $user->id, $userData);
        
        return $this->success(null, 'User deleted', 204);
    }

    public function getUserRoles(User $user)
    {
        return $this->success([
            'user_id' => $user->id,
            'roles' => $user->getRoleNames(),
            'role_objects' => $user->roles
        ]);
    }

    public function getUserPermissions(User $user)
    {
        return $this->success([
            'user_id' => $user->id,
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'permission_objects' => $user->getAllPermissions()
        ]);
    }

    /**
     * Resend welcome set-password link to an unverified user (admin only)
     */
    public function resendWelcome(Request $request, User $user)
    {
        $this->authorize('update', $user);
        if (!is_null($user->email_verified_at)) {
            return $this->error('User already verified.', 409);
        }
        try {
            $token = Password::broker('welcome')->createToken($user);
            $frontendBase = rtrim((string) (config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url')), '/');
            $setPasswordUrl = $frontendBase.'/auth/set-password?token='.$token.'&email='.urlencode($user->email);
            Mail::to($user->email)->queue((new WelcomeSetPasswordMail($user, $setPasswordUrl))->delay(now()->addSeconds(5)));
        } catch (\Throwable $e) {
            Log::warning('Failed to resend welcome password setup email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            return $this->error('Failed to send email', 500);
        }

        app(AuditLogger::class)->log($request, 'user.welcome.resend', 'User', $user->id, [
            'user_email' => $user->email,
        ]);

        return $this->success(null, 'Verification email sent');
    }
}


