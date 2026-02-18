<?php

namespace App\Services;

use App\Mail\AccountVerificationMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class AccountVerificationEmailService
{
    public function send(User $user): void
    {
        if (empty($user->email)) {
            Log::warning('Skipping account verification email: missing email address', [
                'user_id' => $user->id,
            ]);

            return;
        }

        if ($user->hasVerifiedEmail()) {
            Log::info('User already verified, skipping verification email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);

            return;
        }

        try {
            $expirationMinutes = (int) (config('auth.verification.expire', 60));
            $parameters = [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ];

            $frontendBase = config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url');
            if ($frontendBase) {
                $parameters['redirect'] = rtrim((string) $frontendBase, '/') . '/auth/sign-in';
            }

            $verificationUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes($expirationMinutes > 0 ? $expirationMinutes : 60),
                $parameters
            );

            Mail::to($user->email)->queue(new AccountVerificationMail($user, $verificationUrl));

            Log::info('Account verification email sent', [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Failed to send account verification email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}


