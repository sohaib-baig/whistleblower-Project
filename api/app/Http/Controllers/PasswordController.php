<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Log;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Password\ForgotPasswordRequest;
use App\Http\Requests\Password\ResetPasswordRequest;
use App\Models\User;
use App\Services\AuditLogger;

class PasswordController extends Controller
{
    use ApiResponse;

    public function sendResetLink(ForgotPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();
        if(!$user || empty($user->email_verified_at) || (int) $user->is_active === 0){
            Log::warning('Skipping password reset link request', [
                'email' => $request->email,
                'user_found' => (bool) $user,
                'email_verified' => $user?->email_verified_at ? true : false,
                'is_active' => $user?->is_active,
            ]);

            $status = "";
            return $this->success(null, __($status));
        }

        $status = Password::broker()->sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            app(AuditLogger::class)->log($request, 'password.forgot');
            return $this->success(null, __($status));
        }

        return $this->error(__($status), 422);
    }

    public function reset(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'token', 'password', 'password_confirmation'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->string('password')),
                    'remember_token' => Str::random(60),
                    'initial_password' => null,
                ])->save();
                event(new PasswordReset($user));
            }
        );
        if ($status === Password::PASSWORD_RESET) {
            app(AuditLogger::class)->log($request, 'password.reset');
            return $this->success(null, __($status));
        }
        return $this->error(__($status), 422);
    }

    /**
     * Welcome set password using existing broker token
     * Also allows verified users without password to set one
     */
    public function setPassword(ResetPasswordRequest $request)
    {
        $existingUser = User::where('email', $request->string('email'))->first();
        
        // If user already set their own password (no initial_password), block re-use
        if ($existingUser && empty($existingUser->initial_password)) {
            return $this->error(__('Password already set for this account.'), 409);
        }

        $status = Password::broker('welcome')->reset(
            $request->only('email', 'token', 'password', 'password_confirmation'),
            function ($user) use ($request) {
                $updates = [
                    'password' => Hash::make($request->string('password')),
                    'remember_token' => Str::random(60),
                    'initial_password' => null,
                ];
                
                // Only set email_verified_at and is_active if not already set
                if (is_null($user->email_verified_at)) {
                    $updates['email_verified_at'] = now();
                }
                
                if ((int) $user->is_active === 2) {
                    $updates['is_active'] = 1;
                }
                
                $user->forceFill($updates)->save();
            }
        );
        if ($status === Password::PASSWORD_RESET) {
            app(AuditLogger::class)->log($request, 'password.set');
            return $this->success(null, __($status));
        }
        return $this->error(__($status), 422);
    }

    /**
     * Check whether a token is valid for a given email and broker.
     */
    public function check(Request $request)
    {
        try {
            $request->validate([
                'email' => ['required','email','max:255'],
                'token' => ['required','string','min:40','max:200'],
                'broker' => ['sometimes','string','in:defaults,welcome'],
            ]);
            
            // Rate limiting for token checks (prevent brute force)
            $key = 'password_check:' . $request->ip();
            if (RateLimiter::tooManyAttempts($key, 10)) {
                return $this->error('Too many attempts. Please try again later.', 429);
            }
            RateLimiter::hit($key, 60); // 1 minute window
            
            $brokerName = $request->string('broker')->toString() ?: config('auth.defaults.passwords');
            $broker = Password::broker($brokerName);
            $email = $request->string('email')->toString();
            $rawToken = $request->query('token');
            $token = is_string($rawToken) ? urldecode(trim($rawToken)) : $request->string('token')->toString();
            $user = User::where('email', $email)->first();
            if (! $user) {
                // Use generic message to prevent email enumeration
                return $this->error('Invalid token', 422);
            }
            $repo = $broker->getRepository();
            $valid = false;
            if (method_exists($repo, 'exists')) {
                // Some repositories expect the raw token string, not hashed
                $valid = $repo->exists($user, $token);
            } elseif (method_exists($repo, 'tokenExists')) {
                $valid = $repo->tokenExists($user, $token);
            }
            // For welcome broker, if user is already verified AND has set their own password (no initial_password), treat as invalid (one-time use)
            // But allow if verified user still has initial_password (hasn't set their own password yet)
            if ($brokerName === 'welcome' && !is_null($user->email_verified_at) && empty($user->initial_password)) {
                return $this->error('Invalid token', 422);
            }
            if ($valid) {
                return $this->success(['valid' => true], 'Token valid');
            }
            return $this->error('Invalid token', 422);
        } catch (\Exception $e) {
            Log::warning('Password token check error', [
                'ip' => $request->ip(),
                // Avoid leaking raw email/token; log hashed identifiers
                'email_hash' => hash('sha256', (string) $request->input('email')),
                'broker' => (string) $request->input('broker', ''),
                'error' => $e->getMessage(),
            ]);
            return $this->error('Invalid token', 422);
        }
    }
}


