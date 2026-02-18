<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    private string $secretKey;
    private string $siteKey;
    private string $verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function __construct()
    {
        $this->secretKey = config('services.turnstile.secret_key', env('TURNSTILE_SECRET_KEY', ''));
        $this->siteKey = config('services.turnstile.site_key', env('TURNSTILE_SITE_KEY', ''));
    }

    /**
     * Check if Turnstile verification should be skipped (local environment)
     * 
     * Can be forced enabled in local for testing by setting TURNSTILE_FORCE_ENABLE=true
     */
    public function shouldSkipVerification(): bool
    {
        // Check if explicitly forced enabled (for local testing)
        $forceEnable = env('TURNSTILE_FORCE_ENABLE', false) === true || env('TURNSTILE_FORCE_ENABLE', 'false') === 'true';
        
        if ($forceEnable) {
            return false; // Don't skip if force enabled
        }
        
        $env = config('app.env', 'production');
        return in_array($env, ['local', 'development'], true);
    }

    /**
     * Verify Turnstile token
     *
     * @param string $token The Turnstile token to verify
     * @param string|null $remoteIp The user's IP address (optional but recommended)
     * @return array Returns ['success' => bool, 'error' => string|null, 'challenge_ts' => string|null]
     */
    public function verify(string $token, ?string $remoteIp = null): array
    {
        // Skip verification in local/development environment
        if ($this->shouldSkipVerification()) {
            Log::info('Turnstile verification skipped (local environment)');
            return [
                'success' => true,
                'error' => null,
                'challenge_ts' => now()->toIso8601String(),
            ];
        }

        if (empty($token)) {
            return [
                'success' => false,
                'error' => 'Turnstile token is missing',
            ];
        }

        if (empty($this->secretKey)) {
            Log::error('Turnstile secret key is not configured');
            return [
                'success' => false,
                'error' => 'Turnstile is not properly configured',
            ];
        }

        try {
            $response = Http::asForm()->post($this->verifyUrl, [
                'secret' => $this->secretKey,
                'response' => $token,
                'remoteip' => $remoteIp ?? request()->ip(),
            ]);

            $data = $response->json();

            if (!$response->successful() || !isset($data['success'])) {
                Log::warning('Turnstile verification failed', [
                    'status' => $response->status(),
                    'response' => $data,
                ]);

                return [
                    'success' => false,
                    'error' => $data['error-codes'][0] ?? 'Verification failed',
                    'challenge_ts' => $data['challenge_ts'] ?? null,
                ];
            }

            if ($data['success'] === true) {
                return [
                    'success' => true,
                    'error' => null,
                    'challenge_ts' => $data['challenge_ts'] ?? null,
                ];
            }

            // Token verification failed
            $errorCodes = $data['error-codes'] ?? [];
            Log::warning('Turnstile token verification failed', [
                'error_codes' => $errorCodes,
            ]);

            return [
                'success' => false,
                'error' => $errorCodes[0] ?? 'Token verification failed',
                'challenge_ts' => $data['challenge_ts'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Turnstile verification exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Verification service unavailable',
            ];
        }
    }

    /**
     * Get the site key (for frontend use)
     */
    public function getSiteKey(): string
    {
        return $this->siteKey;
    }
}

