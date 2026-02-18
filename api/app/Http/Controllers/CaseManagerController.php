<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\CaseManager\StoreCaseManagerRequest;
use App\Http\Requests\CaseManager\UpdateCaseManagerRequest;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeSetPasswordMail;
use App\Mail\CaseManagerCreatedMail;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class CaseManagerController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all case managers (users with 'case_manager' role)
     * If user is admin: show all case managers
     * If user is company: show only case managers added by that company
     * When admin impersonates company: show only that company's case managers
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $isImpersonating = $request->session()->has('impersonator_id');
        
        // If impersonating, check admin permissions
        if ($isImpersonating) {
            $impersonatorId = $request->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->can('users.viewAny')) {
                return $this->error('Unauthorized', 403);
            }
            // When impersonating, filter by the impersonated company user's ID
            // $currentUser is the company being impersonated
        } else {
            // Allow admin and company users to view case managers
            // Admin can see all, company can see only their own (filtered below)
            if (!$currentUser->hasRole('admin') && !$currentUser->hasRole('company')) {
                return $this->error('Unauthorized', 403);
            }
        }

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = User::with('roles')
            ->whereHas('roles', function($q) {
                $q->where('name', 'case_manager');
            });

        // Filter logic:
        // 1. If impersonating: filter by the impersonated company user's ID
        // 2. If not impersonating and user is admin: show all (no filter)
        // 3. If not impersonating and user is company: filter by their ID
        if ($isImpersonating) {
            // Admin impersonating company: show only that company's case managers
            $query->where('company_id', $currentUser->id);
        } elseif (!$currentUser->hasRole('admin')) {
            // Regular company user: show only case managers added by this company
            $query->where('company_id', $currentUser->id);
        }
        // If regular admin (not impersonating), show all case managers (no filter)

        // Search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
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
        $allowedSorts = ['name', 'email', 'phone', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        } elseif ($sort === 'status') {
            $query->orderBy('is_active', $order);
        }

        $caseManagers = $query->paginate($perPage);

        // Transform data to include role information
        $caseManagers->getCollection()->transform(function ($caseManager) {
            $caseManager->role_names = $caseManager->roles->pluck('name')->toArray();
            $caseManager->primary_role = $caseManager->roles->first()?->name ?? 'No Role';
            return $caseManager;
        });

        return $this->success($caseManagers);
    }

    /**
     * Show a specific case manager
     */
    public function show(User $case_manager): JsonResponse
    {
        // Verify the user has case_manager role
        if (!$case_manager->hasRole('case_manager')) {
            return $this->error('User is not a case manager', 404);
        }

        $currentUser = request()->user();
        
        // If impersonating, use admin's permissions
        if (request()->session()->has('impersonator_id')) {
            $impersonatorId = request()->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->can('users.view')) {
                return $this->error('Unauthorized', 403);
            }
        } else {
            // Allow admin to view any case manager, company to view their own case managers
            if ($currentUser->hasRole('admin')) {
                // Admin can view any case manager
            } elseif ($currentUser->hasRole('company') && $case_manager->company_id === $currentUser->id) {
                // Company can view their own case managers
            } else {
                return $this->error('Unauthorized', 403);
            }
        }
        
        return $this->success($case_manager->load(['roles', 'permissions']));
    }

    /**
     * Create a new case manager user and assign 'case_manager' role
     */
    public function store(StoreCaseManagerRequest $request): JsonResponse
    {
        // Only company users can create case managers
        $currentUser = $request->user();
        if (!$currentUser->hasRole('company')) {
            return $this->error('Only company users can create case managers', 403);
        }

        $data = $request->validated();

        $user = new User();

        // Required fields for case manager
        $user->name = $data['name'];
        $user->email = $data['email'];

        // Store the company ID (the current user creating the case manager)
        $user->company_id = $currentUser->id;

        // Capture plain password for email before hashing
        $plainPassword = '';
        
        // Optional password (if not provided, welcome email will be sent with password setup link)
        if (!empty($data['password'])) {
            $plainPassword = $data['password'];
            $user->password = Hash::make($plainPassword);
        } else {
            // Generate a temporary password to mark as verified/active
            $plainPassword = Str::random(16);
            $user->password = Hash::make($plainPassword);
        }

        // Optional profile fields
        foreach (['phone', 'country', 'address', 'state', 'city', 'zip_code'] as $field) {
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
                $user->is_active = in_array($code, [0, 1, 2], true) ? $code : 2;
            }
        } else {
            // Default to active for company created case managers
            $user->is_active = 1;
        }

        if (empty($user->email_verified_at)) {
            $user->email_verified_at = now();
        }

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_path = $path;
        }

        $user->save();

        // Always assign 'case_manager' role to newly created case manager
        $caseManagerRole = Role::where('name', 'case_manager')->first();
        if ($caseManagerRole) {
            $user->assignRole($caseManagerRole);
        }

        // Send "Case Manager Created" email with username, email, password, and company name
        try {
            // Get the company that created the case manager
            // When impersonating, $currentUser is the company being impersonated, so use it directly
            // Otherwise, find the company by company_id
            $company = null;
            if ($request->session()->has('impersonator_id')) {
                // Admin is impersonating - $currentUser is the company being impersonated
                $company = $currentUser;
            } else {
                // Regular company user - find by company_id
                $company = User::find($user->company_id);
            }
            
            if (!$company) {
                // Fallback: try to find by company_id if not already set
                $company = User::find($user->company_id);
            }
            
            if (!$company) {
                Log::warning('Company not found for case manager', [
                    'case_manager_id' => $user->id,
                    'company_id' => $user->company_id,
                    'current_user_id' => $currentUser->id,
                    'is_impersonating' => $request->session()->has('impersonator_id'),
                ]);
            }
            
            // Get company name - try company_name first, then name, fallback to 'Company'
            $companyName = null;
            if ($company) {
                // Try multiple fields to get company name
                $companyName = $company->company_name 
                    ?? $company->name 
                    ?? $company->company_name 
                    ?? null;
            }
            
            // If still empty, try to get from the current user (in case of impersonation)
            if (empty($companyName)) {
                $companyName = $currentUser->company_name ?? $currentUser->name ?? null;
            }
            
            // Final fallback - but log a warning if we're using it
            if (empty($companyName)) {
                Log::warning('Company name is empty, using fallback', [
                    'case_manager_id' => $user->id,
                    'company_id' => $user->company_id,
                    'company_found' => $company ? 'yes' : 'no',
                    'company_company_name' => $company->company_name ?? 'N/A',
                    'company_name' => $company->name ?? 'N/A',
                    'current_user_company_name' => $currentUser->company_name ?? 'N/A',
                    'current_user_name' => $currentUser->name ?? 'N/A',
                ]);
                $companyName = 'Company';
            }
            
            // Log for debugging
            Log::info('Sending case manager created email', [
                'case_manager_id' => $user->id,
                'case_manager_email' => $user->email,
                'company_id' => $user->company_id,
                'company_name_final' => $companyName,
                'is_impersonating' => $request->session()->has('impersonator_id'),
                'current_user_id' => $currentUser->id,
                'current_user_name' => $currentUser->name,
                'current_user_company_name' => $currentUser->company_name ?? 'N/A',
                'company_found' => $company ? 'yes' : 'no',
                'company_company_name' => $company->company_name ?? 'N/A',
                'company_name_field' => $company->name ?? 'N/A',
            ]);
            
            // Send email immediately (not queued) to ensure replacement happens
            try {
                Mail::to($user->email)->send(new CaseManagerCreatedMail($user, $plainPassword, $companyName));
            } catch (\Throwable $sendError) {
                // If immediate send fails, fall back to queue
                Log::warning('Immediate email send failed, falling back to queue', [
                    'error' => $sendError->getMessage(),
                ]);
                Mail::to($user->email)->queue((new CaseManagerCreatedMail($user, $plainPassword, $companyName))->delay(now()->addSeconds(30)));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to send case manager created email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Attach avatar_url for consumers
        $user->avatar_url = $user->avatar_path 
            ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->avatar_path) 
            : null;

        // Prepare audit log data
        $auditData = [
            'user_email' => $user->email,
            'user_name' => $user->name,
            'is_active' => $user->is_active,
            'company_id' => $user->company_id,
        ];

        // Add company context
        $auditData['created_by_company_id'] = $currentUser->id;
        $auditData['created_by_company_name'] = $currentUser->company_name ?? $currentUser->name;

        app(AuditLogger::class)->log($request, 'case_manager.created', 'User', $user->id, $auditData);

        // Notify admin about case manager creation
        try {
            // Get the company that created the case manager
            $company = User::find($user->company_id);
            if ($company) {
                app(\App\Services\NotificationService::class)->notifyCaseManagerCreated($user, $company);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send case manager creation notification', [
                'case_manager_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->success($user->load(['roles', 'permissions']), 'Case manager created successfully', 201);
    }

    /**
     * Update an existing case manager
     */
    public function update(UpdateCaseManagerRequest $request, User $case_manager): JsonResponse
    {
        // Verify the user has case_manager role
        if (!$case_manager->hasRole('case_manager')) {
            return $this->error('User is not a case manager', 404);
        }

        // If impersonating, use admin's permissions
        if ($request->session()->has('impersonator_id')) {
            $impersonatorId = $request->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->can('users.update')) {
                return $this->error('Unauthorized', 403);
            }
        } else {
            $currentUser = $request->user();
            if ($currentUser->hasRole('company')) {
                if ($case_manager->company_id !== $currentUser->id) {
                    return $this->error('Unauthorized', 403);
                }
            } else {
                $this->authorize('update', $case_manager);
            }
        }

        $data = $request->validated();
        $oldData = $case_manager->only(['name', 'email', 'is_active']);

        // Handle is_active mapping if provided
        if (array_key_exists('is_active', $data)) {
            $incoming = $data['is_active'];
            if (is_bool($incoming)) {
                $case_manager->is_active = $incoming ? 1 : 2;
            } else {
                $code = (int) $incoming;
                $case_manager->is_active = in_array($code, [0, 1, 2], true) ? $code : $case_manager->is_active;
            }
        }

        // Optional password update (only if provided)
        if (!empty($data['password'])) {
            $case_manager->password = $data['password'];
        }

        // Optional profile fields
        foreach (['name', 'email', 'phone', 'country', 'address', 'state', 'city', 'zip_code'] as $field) {
            if (array_key_exists($field, $data)) {
                $case_manager->{$field} = $data[$field];
            }
        }

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $case_manager->avatar_path = $path;
        }

        $case_manager->save();

        app(AuditLogger::class)->log($request, 'case_manager.updated', 'User', $case_manager->id, [
            'user_email' => $case_manager->email,
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($case_manager->load(['roles', 'permissions']), 'Case manager updated successfully');
    }

    /**
     * Delete a case manager (soft delete)
     */
    public function destroy(Request $request, User $case_manager): JsonResponse
    {
        // Verify the user has case_manager role
        if (!$case_manager->hasRole('case_manager')) {
            return $this->error('User is not a case manager', 404);
        }

        // If impersonating, use admin's permissions
        if ($request->session()->has('impersonator_id')) {
            $impersonatorId = $request->session()->get('impersonator_id');
            $admin = User::find($impersonatorId);
            if (!$admin || !$admin->can('users.delete')) {
                return $this->error('Unauthorized', 403);
            }
        } else {
            $currentUser = $request->user();
            if ($currentUser->hasRole('company')) {
                if ($case_manager->company_id !== $currentUser->id) {
                    return $this->error('Unauthorized', 403);
                }
            } else {
                $this->authorize('delete', $case_manager);
            }
        }

        $caseManagerData = $case_manager->only(['name', 'email']);
        $case_manager->delete();

        app(AuditLogger::class)->log($request, 'case_manager.deleted', 'User', $case_manager->id, $caseManagerData);

        return $this->success(null, 'Case manager deleted successfully', 204);
    }

    /**
     * Get case managers by company slug or ID (public endpoint for create case page)
     * Supports both slug and ID for backward compatibility
     */
    public function getByCompany(string $identifier): JsonResponse
    {
        // Find company by slug or ID
        $company = User::where(function($query) use ($identifier) {
            $query->where('company_slug', $identifier)
                  ->orWhere('id', $identifier);
        })->first();
        
        if (!$company) {
            return $this->error('Company not found', 404);
        }
        
        $companyId = $company->id;
        
        // Get case managers where company_id matches the provided company ID
        // Include both active and pending case managers (exclude banned)
        $caseManagers = User::with('roles')
            ->whereHas('roles', function($q) {
                $q->where('name', 'case_manager');
            })
            ->where('company_id', $companyId)
            ->whereIn('is_active', [1, 2]) // Active (1) or Pending (2), exclude Banned (0)
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'email'])
            ->map(function ($caseManager) {
                return [
                    'id' => $caseManager->id,
                    'name' => $caseManager->name,
                    'email' => $caseManager->email,
                ];
            });

        return $this->success($caseManagers);
    }
}
