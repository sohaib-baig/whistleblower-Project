<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    use ApiResponse;

    /**
     * Get current 2FA status for the authenticated user.
     */
    public function status(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        return $this->success([
            'enabled' => (bool) $user->two_factor_enabled,
            'method' => $user->two_factor_method,
            'has_secret' => !empty($user->two_factor_secret),
        ]);
    }

    /**
     * Send a 2FA verification code to the user's email address.
     * This is used both for enabling 2FA via email and for login verification.
     */
    public function sendEmailCode(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'reason' => ['sometimes', 'string', 'in:enable,login'],
        ]);

        $reason = $request->input('reason', 'enable');

        // Generate a 6-digit numeric code
        $code = random_int(100000, 999999);

        $user->two_factor_email_code = Hash::make((string) $code);
        $user->two_factor_email_expires_at = now()->addMinutes(10);
        $user->save();

        try {
            $subject = config('app.name', 'Wisling') . ' - Two-factor authentication code';
            $bodyLines = [
                'Hi ' . ($user->name ?: $user->email) . ',',
                '',
                'Your two-factor authentication code is: ' . $code,
                '',
                'This code will expire in 10 minutes.',
            ];

            Mail::raw(implode(PHP_EOL, $bodyLines), function ($message) use ($user, $subject) {
                $message->to($user->email)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::error('Failed to send 2FA email code', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
            ]);

            return $this->error('Failed to send verification code. Please try again later.', 500);
        }

        app(AuditLogger::class)->log($request, '2fa.email_code.sent', 'User', $user->id, [
            'reason' => $reason,
        ]);

        return $this->success(null, 'Verification code sent to your email.');
    }

    /**
     * Generate a TOTP secret for use with Google Authenticator or similar apps.
     * Returns the secret and an otpauth:// URL that the frontend can turn into a QR code.
     */
    public function setupApp(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        // Generate a random 32-character base32-like secret
        $random = Str::random(32);
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', 'A', base64_encode($random)));

        $user->two_factor_secret = $secret;
        $user->save();

        $appName = config('app.name', 'Wisling');
        $label = rawurlencode($appName . ':' . $user->email);
        $issuer = rawurlencode($appName);

        $otpauthUrl = sprintf('otpauth://totp/%s?secret=%s&issuer=%s', $label, $secret, $issuer);

        app(AuditLogger::class)->log($request, '2fa.app.setup', 'User', $user->id);

        return $this->success([
            'secret' => $secret,
            'otpauth_url' => $otpauthUrl,
        ], 'Authenticator app secret generated.');
    }

    /**
     * Enable 2FA for the authenticated user.
     * For email method, verifies the email code.
     * For app method, verifies a TOTP code from the authenticator app.
     */
    public function enable(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $data = $request->validate([
            'method' => ['required', 'string', 'in:email,app'],
            'code' => ['required', 'string', 'max:10'],
        ]);

        $method = $data['method'];
        $code = $data['code'];

        if ($method === 'email') {
            if (
                empty($user->two_factor_email_code) ||
                empty($user->two_factor_email_expires_at) ||
                now()->greaterThan($user->two_factor_email_expires_at)
            ) {
                return $this->error('Verification code has expired. Please request a new one.', 422);
            }

            if (! Hash::check($code, (string) $user->two_factor_email_code)) {
                return $this->error('Invalid verification code.', 422);
            }

            // Clear the one-time code after successful verification
            $user->two_factor_email_code = null;
            $user->two_factor_email_expires_at = null;
            
            // Clear authenticator app data to ensure mutual exclusivity
            $user->two_factor_secret = null;
        } else {
            // App (TOTP) method
            if (empty($user->two_factor_secret)) {
                return $this->error('Authenticator app is not set up yet.', 422);
            }

            if (! $this->verifyTotpCode($user->two_factor_secret, $code)) {
                return $this->error('Invalid authentication code.', 422);
            }
            
            // Clear email 2FA data to ensure mutual exclusivity
            $user->two_factor_email_code = null;
            $user->two_factor_email_expires_at = null;
        }

        $user->two_factor_enabled = true;
        $user->two_factor_method = $method;
        $user->save();

        app(AuditLogger::class)->log($request, '2fa.enabled', 'User', $user->id, [
            'method' => $method,
        ]);

        return $this->success([
            'enabled' => true,
            'method' => $method,
        ], 'Two-factor authentication enabled.');
    }

    /**
     * Disable 2FA for the authenticated user.
     */
    public function disable(Request $request)
    {
        /** @var User $user */
        $user = $request->user();

        $user->two_factor_enabled = false;
        $user->two_factor_method = null;
        $user->two_factor_secret = null;
        $user->two_factor_email_code = null;
        $user->two_factor_email_expires_at = null;
        $user->save();

        app(AuditLogger::class)->log($request, '2fa.disabled', 'User', $user->id);

        return $this->success([
            'enabled' => false,
            'method' => null,
        ], 'Two-factor authentication disabled.');
    }

    /**
     * Verify a 2FA code during login and complete the authentication.
     */
    public function verify(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'max:10'],
        ]);

        /** @var User|null $user */
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            return $this->error('Invalid verification code.', 422);
        }

        if (! $user->two_factor_enabled || ! $user->two_factor_method) {
            return $this->error('Two-factor authentication is not enabled for this account.', 422);
        }

        // Check account status (banned / email verified) similar to login
        if ((int) ($user->is_active ?? 0) === 0) {
            return $this->error('Account is banned.', 403);
        }

        if (method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
            return $this->error('Email not verified.', 403);
        }

        $code = $data['code'];

        if ($user->two_factor_method === 'email') {
            if (
                empty($user->two_factor_email_code) ||
                empty($user->two_factor_email_expires_at) ||
                now()->greaterThan($user->two_factor_email_expires_at)
            ) {
                return $this->error('Verification code has expired. Please login again to receive a new code.', 422);
            }

            if (! Hash::check($code, (string) $user->two_factor_email_code)) {
                return $this->error('Invalid verification code.', 422);
            }

            // Clear the one-time code after successful verification
            $user->two_factor_email_code = null;
            $user->two_factor_email_expires_at = null;
            $user->save();
        } else {
            if (empty($user->two_factor_secret)) {
                return $this->error('Two-factor authentication is misconfigured. Please contact support.', 500);
            }

            if (! $this->verifyTotpCode($user->two_factor_secret, $code)) {
                return $this->error('Invalid authentication code.', 422);
            }
        }

        // Complete the login
        Auth::login($user, true);
        $request->session()->regenerate();

        app(AuditLogger::class)->log($request, 'auth.login.2fa', 'User', $user->id, [
            'method' => $user->two_factor_method,
        ]);

        return $this->success(null, 'Logged in');
    }

    /**
     * Minimal TOTP verification compatible with Google Authenticator.
     *
     * @param string $secret Base32-like encoded secret
     * @param string $code   6-digit code provided by user
     */
    protected function verifyTotpCode(string $secret, string $code): bool
    {
        $code = trim($code);
        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $timeStep = 30;
        $window = 1; // allow +/- 1 step for clock drift
        $currentTime = time();

        $binarySecret = $this->base32Decode($secret);
        if ($binarySecret === null) {
            return false;
        }

        for ($i = -$window; $i <= $window; $i++) {
            $counter = intdiv($currentTime, $timeStep) + $i;
            $generated = $this->totpFromCounter($binarySecret, $counter);
            if (hash_equals($generated, $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Decode a Base32 string into binary.
     */
    protected function base32Decode(string $secret): ?string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));
        $bits = '';

        foreach (str_split($secret) as $char) {
            $pos = strpos($alphabet, $char);
            if ($pos === false) {
                return null;
            }
            $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $binary = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $binary .= chr(bindec($byte));
            }
        }

        return $binary;
    }

    /**
     * Generate a 6-digit TOTP from a binary secret and counter.
     */
    protected function totpFromCounter(string $binarySecret, int $counter): string
    {
        $counterBin = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $counterBin, $binarySecret, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $segment = substr($hash, $offset, 4);

        $value = unpack('N', $segment)[1] & 0x7FFFFFFF;
        $code = $value % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }
}


