<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Symfony\Component\HttpFoundation\Response;

class RequirePassword
{
    /**
     * Handle an incoming request.
     * Ensures verified users have a password set before accessing protected routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip password requirement check for password set/reset endpoints and /me endpoint
        // /me is used to check auth status and shouldn't invalidate tokens
        // Also allow change-password endpoint so users with initial_password can set their password
        $path = $request->path();
        if (str_contains($path, 'password/set') || 
            str_contains($path, 'password/reset') || 
            str_contains($path, 'password/check') ||
            str_contains($path, 'profile/change-password') ||
            str_contains($path, 'auth/me')) {
            return $next($request);
        }
        
        $user = $request->user();
        
        // Only check for authenticated, verified users who still have initial_password set
        // (meaning they haven't set their own password yet)
        if ($user && !is_null($user->email_verified_at) && !empty($user->initial_password)) {
            $isApi = $request->expectsJson() || $request->is('api/*') || $request->is('api/v1/*');
            
            if ($isApi) {
                // Don't generate a new token here - it would invalidate existing tokens
                // Instead, just return an error indicating password setup is required
                // The frontend can request a new token via the requestPasswordSetToken endpoint if needed
                return response()->json([
                    'status' => false,
                    'message' => 'Please set your password to continue.',
                    'data' => [
                        'requires_password_setup' => true,
                        'email' => $user->email,
                    ],
                ], 403);
            }
        }
        
        return $next($request);
    }
}

