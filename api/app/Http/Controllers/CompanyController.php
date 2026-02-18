<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Http\Requests\Company\UpdateCompanyRequest;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeSetPasswordMail;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * List all companies (users with 'company' role)
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $search = $request->string('search')->toString();
        $status = $request->string('status', 'all')->toString();
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();

        $query = User::with('roles')
            ->whereHas('roles', function($q) {
                $q->where('name', 'company');
            });

        // Search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
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
        $allowedSorts = ['name', 'email', 'company_name', 'phone', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        } elseif ($sort === 'status') {
            $query->orderBy('is_active', $order);
        }

        $companies = $query->paginate($perPage);

        // Transform data to include role information
        $companies->getCollection()->transform(function ($company) {
            $company->role_names = $company->roles->pluck('name')->toArray();
            $company->primary_role = $company->roles->first()?->name ?? 'No Role';
            return $company;
        });

        return $this->success($companies);
    }

    /**
     * Show a specific company
     */
    public function show(User $company): JsonResponse
    {
        // Verify the user has company role
        if (!$company->hasRole('company')) {
            return $this->error('User is not a company', 404);
        }

        $this->authorize('view', $company);
        
        return $this->success($company->load(['roles', 'permissions']));
    }

    /**
     * Public: Minimal company info for public pages (no auth required)
     * Supports both UUID (id) and slug for backward compatibility
     */
    public function publicShow(string $identifier): JsonResponse
    {
        // Try to find by slug first, then by ID (UUID)
        // Use a more precise query to avoid conflicts
        $company = User::where(function($query) use ($identifier) {
            $query->where('company_slug', $identifier)
                  ->orWhere('id', $identifier);
        })->first();

        if (!$company) {
            return $this->error('Company not found', 404);
        }

        // Verify the user has company role
        if (!$company->hasRole('company')) {
            return $this->error('User is not a company', 404);
        }

        // Check if company is active (if is_active field exists and is checked)
        if (isset($company->is_active) && !$company->is_active) {
            return $this->error('Company is not active', 404);
        }

        $logoUrl = $company->avatar_path ? Storage::url($company->avatar_path) : null;

        return $this->success([
            'id' => $company->id,
            'slug' => $company->company_slug,
            'name' => $company->company_name ?: $company->name,
            'logo_url' => $logoUrl,
            'phone' => $company->phone,
            'phone_hours_from' => $company->phone_hours_from,
            'phone_hours_to' => $company->phone_hours_to,
            'phone_hours_format' => $company->phone_hours_format ?? '24h',
            'email' => $company->email,
            'address' => $company->address,
            'physical_address' => $company->physical_address,
        ], 'Company retrieved');
    }

    /**
     * Create a new company user and assign 'company' role
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        $user = new User();

        // Required fields for company
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->company_name = $data['company_name'] ?? null;

        // Optional password (if not provided, welcome email will be sent with password setup link)
        if (!empty($data['password'])) {
            $user->password = $data['password'];
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
            // Default to pending on create
            $user->is_active = 2;
        }

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_path = $path;
        }

        $user->save();

        // Always assign 'company' role to newly created company
        $companyRole = Role::where('name', 'company')->first();
        if ($companyRole) {
            $user->assignRole($companyRole);
        }

        // Create default theme configuration for the new company user
        ThemeConfigurationController::createDefaultForUser($user->id);

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
        $user->avatar_url = $user->avatar_path 
            ? \Illuminate\Support\Facades\Storage::url($user->avatar_path) 
            : null;

        app(AuditLogger::class)->log($request, 'company.created', 'User', $user->id, [
            'user_email' => $user->email,
            'user_name' => $user->name,
            'company_name' => $user->company_name,
            'is_active' => $user->is_active,
        ]);

        // Notify admin about new company registration
        try {
            app(\App\Services\NotificationService::class)->notifyCompanyRegistered($user);
        } catch (\Exception $e) {
            Log::warning('Failed to send company registration notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->success($user->load(['roles', 'permissions']), 'Company created successfully', 201);
    }

    /**
     * Update an existing company
     */
    public function update(UpdateCompanyRequest $request, User $company): JsonResponse
    {
        // Verify the user has company role
        if (!$company->hasRole('company')) {
            return $this->error('User is not a company', 404);
        }

        $this->authorize('update', $company);

        $data = $request->validated();
        $oldData = $company->only(['name', 'email', 'company_name', 'is_active']);

        // Handle is_active mapping if provided
        if (array_key_exists('is_active', $data)) {
            $incoming = $data['is_active'];
            if (is_bool($incoming)) {
                $company->is_active = $incoming ? 1 : 2;
            } else {
                $code = (int) $incoming;
                $company->is_active = in_array($code, [0, 1, 2], true) ? $code : $company->is_active;
            }
        }

        // Optional password update (only if provided)
        if (!empty($data['password'])) {
            $company->password = $data['password'];
        }

        // Optional profile fields
        foreach (['name', 'email', 'company_name', 'phone', 'country', 'address', 'state', 'city', 'zip_code'] as $field) {
            if (array_key_exists($field, $data)) {
                $company->{$field} = $data[$field];
            }
        }

        // Handle avatar upload if provided
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $company->avatar_path = $path;
        }

        $company->save();

        app(AuditLogger::class)->log($request, 'company.updated', 'User', $company->id, [
            'user_email' => $company->email,
            'changes' => array_diff_assoc($data, $oldData),
        ]);

        return $this->success($company->load(['roles', 'permissions']), 'Company updated successfully');
    }

    /**
     * Delete a company (soft delete)
     */
    public function destroy(Request $request, User $company): JsonResponse
    {
        // Verify the user has company role
        if (!$company->hasRole('company')) {
            return $this->error('User is not a company', 404);
        }

        $this->authorize('delete', $company);

        $companyData = $company->only(['name', 'email', 'company_name']);
        $company->delete();

        app(AuditLogger::class)->log($request, 'company.deleted', 'User', $company->id, $companyData);

        return $this->success(null, 'Company deleted successfully', 204);
    }
}

