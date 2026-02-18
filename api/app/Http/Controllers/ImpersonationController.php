<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Auth;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class ImpersonationController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * Start impersonating a user (login as)
     */
    public function start(Request $request, User $user): JsonResponse
    {
        // Only admins can impersonate (support both Spatie roles and legacy role column)
        $currentUser = $request->user();
        if ($currentUser) {
            // Ensure roles relationship is loaded for accurate checks
            $currentUser->loadMissing('roles');
        }

        $isAdmin = $currentUser && (
            $currentUser->hasRole('admin') ||
            ($currentUser->role ?? null) === 'admin'
        );

        if (!$isAdmin) {
            \Illuminate\Support\Facades\Log::warning('Impersonation attempt blocked: user is not admin', [
                'current_user_id' => $currentUser?->id,
                'current_user_email' => $currentUser?->email,
                'current_user_role_column' => $currentUser?->role,
                'current_user_roles' => $currentUser?->getRoleNames()->toArray(),
            ]);

            return $this->error('Unauthorized. Only admins can impersonate users.', 403);
        }

        // Cannot impersonate yourself
        if ($request->user()->id === $user->id) {
            return $this->error('Cannot impersonate yourself', 400);
        }

        // Cannot impersonate another admin
        if ($user->hasRole('admin')) {
            return $this->error('Cannot impersonate another admin', 403);
        }

        // Cannot impersonate banned users
        if ((int) $user->is_active === 0) {
            return $this->error('Cannot impersonate banned users', 403);
        }

        // Store the admin user ID before login (we'll need it after)
        $adminUserId = $currentUser->id;
        $adminUserName = $currentUser->name;

        // Log the impersonation
        app(AuditLogger::class)->log($request, 'impersonation.started', 'User', $user->id, [
            'admin_id' => $adminUserId,
            'admin_name' => $adminUserName,
            'target_id' => $user->id,
            'target_name' => $user->name,
            'target_email' => $user->email,
        ]);

        // Refresh user model to ensure all relationships and attributes are loaded
        // This is especially important for newly created users
        $user->refresh();
        $user->load(['roles', 'permissions']);
        
        // Login as the target user using web guard (session-based)
        Auth::guard('web')->login($user);
        
        // Regenerate session after login to prevent session fixation
        // Note: regenerate() should preserve session data, but we'll restore it to be safe
        $request->session()->regenerate();
        
        // Store the original admin user ID in session AFTER regeneration
        // This ensures the session data persists even if regeneration clears it
        $request->session()->put('impersonator_id', $adminUserId);
        $request->session()->put('impersonating', true);
        // Bypass 2FA during impersonation - store flag to skip 2FA checks
        $request->session()->put('impersonation_bypass_2fa', true);
        
        // Force save the session to ensure it's persisted immediately
        // This is critical for newly created users where session might not be fully initialized
        $request->session()->save();
        
        // Verify the session data is stored correctly
        $storedImpersonatorId = $request->session()->get('impersonator_id');
        if ($storedImpersonatorId !== $adminUserId) {
            // If not stored correctly, try again
            \Illuminate\Support\Facades\Log::warning('Impersonator ID not stored correctly, retrying', [
                'expected' => $adminUserId,
                'stored' => $storedImpersonatorId,
            ]);
            $request->session()->put('impersonator_id', $adminUserId);
            $request->session()->put('impersonating', true);
            $request->session()->save();
        }
        
        // Log for debugging
        \Illuminate\Support\Facades\Log::info('Impersonation started', [
            'admin_user_id' => $adminUserId,
            'target_user_id' => $user->id,
            'target_user_email' => $user->email,
            'target_user_created_at' => $user->created_at,
            'session_id' => $request->session()->getId(),
            'impersonator_id_in_session' => $request->session()->get('impersonator_id'),
            'session_has_impersonator_id' => $request->session()->has('impersonator_id'),
            'session_driver' => config('session.driver'),
        ]);

        // Create response with user data
        $response = $this->success([
            'user' => $user->load(['roles', 'permissions']),
            'impersonating' => true,
            'can_leave_impersonation' => true,
        ], 'Successfully logged in as ' . $user->name);
        
        return $response;
    }

    /**
     * Stop impersonating and return to original admin account
     */
    public function stop(Request $request): JsonResponse
    {
        // Check if currently impersonating
        if (!$request->session()->has('impersonator_id')) {
            return $this->error('Not currently impersonating any user', 400);
        }

        $impersonatorId = $request->session()->get('impersonator_id');
        $currentUser = $request->user();

        // Find the original admin user
        $adminUser = User::find($impersonatorId);
        
        if (!$adminUser) {
            // Clean up session if admin not found
            $request->session()->forget(['impersonator_id', 'impersonating']);
            return $this->error('Original admin user not found', 404);
        }

        // Log the return
        app(AuditLogger::class)->log($request, 'impersonation.stopped', 'User', $currentUser->id, [
            'admin_id' => $adminUser->id,
            'admin_name' => $adminUser->name,
            'target_id' => $currentUser->id,
            'target_name' => $currentUser->name,
        ]);

        // Remove impersonation flags from session
        $request->session()->forget(['impersonator_id', 'impersonating', 'impersonation_bypass_2fa']);

        // Login back as admin using web guard (session-based)
        Auth::guard('web')->login($adminUser);
        $request->session()->regenerate();

        return $this->success([
            'user' => $adminUser->load(['roles', 'permissions']),
            'impersonating' => false,
            'can_leave_impersonation' => false,
        ], 'Returned to admin account');
    }

    /**
     * Check current impersonation status
     */
    public function status(Request $request): JsonResponse
    {
        $isImpersonating = $request->session()->has('impersonator_id');
        $impersonatorId = $request->session()->get('impersonator_id');
        $currentUserId = $request->user()?->id;

        // Debug logging
        \Illuminate\Support\Facades\Log::info('Impersonation status check', [
            'current_user_id' => $currentUserId,
            'session_has_impersonator_id' => $isImpersonating,
            'impersonator_id' => $impersonatorId,
            'session_id' => $request->session()->getId(),
            'all_session_keys' => array_keys($request->session()->all()),
        ]);

        $data = [
            'impersonating' => $isImpersonating,
            'can_leave_impersonation' => $isImpersonating,
        ];

        if ($isImpersonating && $impersonatorId) {
            $adminUser = User::find($impersonatorId);
            if ($adminUser) {
                $data['impersonator'] = [
                    'id' => $adminUser->id,
                    'name' => $adminUser->name,
                    'email' => $adminUser->email,
                ];
            } else {
                \Illuminate\Support\Facades\Log::warning('Impersonator user not found', [
                    'impersonator_id' => $impersonatorId,
                ]);
            }
        }

        return $this->success($data);
    }
}
