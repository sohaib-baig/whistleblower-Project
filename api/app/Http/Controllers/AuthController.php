<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Http\Controllers\Concerns\ApiResponse;
use Illuminate\Support\Facades\Storage;
use App\Services\AuditLogger;
use App\Models\User;
use App\Models\Order;
use App\Models\EmailTemplate;
use App\Http\Requests\Auth\CheckEmailRequest;
use App\Http\Requests\Auth\CheckPhoneRequest;
use App\Http\Requests\Auth\CheckCompanyNameRequest;
use App\Http\Requests\Auth\SignupRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Services\StripeService;
use App\Mail\WelcomeEmailWithInvoice;
use App\Mail\InvoiceEmail;
use App\Mail\AdminPaymentNotificationMail;
use App\Mail\WelcomeSetPasswordMail;
use App\Services\AccountVerificationEmailService;
use App\Services\TurnstileService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    use ApiResponse;
    public function login(Request $request)
    {
        $turnstileService = app(TurnstileService::class);
        $skipTurnstile = $turnstileService->shouldSkipVerification();

        Log::info('Login attempt received', [
            'email' => $request->input('email'),
            'skip_turnstile' => $skipTurnstile,
            'has_turnstile_token' => $request->has('turnstile_token'),
            'turnstile_token_length' => $request->has('turnstile_token') ? strlen($request->input('turnstile_token', '')) : 0,
            'ip' => $request->ip(),
        ]);

        // Validate all fields including turnstile_token
        // Make turnstile_token validation more specific to provide better error messages
        $rules = [
            'email' => ['required','email'],
            'password' => ['required','string'],
        ];
        
        if ($skipTurnstile) {
            $rules['turnstile_token'] = ['nullable', 'string'];
        } else {
            $rules['turnstile_token'] = ['required', 'string', 'min:1'];
        }
        
        try {
            $validated = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Login validation failed', [
                'errors' => $e->errors(),
                'email' => $request->input('email'),
                'has_turnstile_token' => $request->has('turnstile_token'),
                'turnstile_token_value' => $request->input('turnstile_token') ? 'present' : 'missing',
                'turnstile_token_length' => $request->has('turnstile_token') ? strlen($request->input('turnstile_token', '')) : 0,
                'skip_turnstile' => $skipTurnstile,
                'all_input_keys' => array_keys($request->all()),
            ]);
            
            // Clear session on validation failure
            if ($request->hasSession()) {
                $request->session()->flush();
            }
            
            // Provide more specific error message for missing turnstile token
            $errors = $e->errors();
            if (isset($errors['turnstile_token']) && !$skipTurnstile) {
                return $this->error('Security verification token is required. Please complete the verification.', 422, [
                    'errors' => $errors,
                ]);
            }
            
            throw $e;
        }

        // Verify Turnstile token (skip in local environment)
        if (!$skipTurnstile) {
            $turnstileToken = $validated['turnstile_token'] ?? null;
            
            Log::info('Turnstile verification attempt', [
                'email' => $validated['email'],
                'has_token' => !empty($turnstileToken),
                'token_length' => $turnstileToken ? strlen($turnstileToken) : 0,
                'ip' => $request->ip(),
            ]);
            
            $verification = $turnstileService->verify($turnstileToken, $request->ip());
            
            if (!$verification['success']) {
                Log::warning('Turnstile verification failed for login attempt', [
                    'email' => $validated['email'],
                    'error' => $verification['error'],
                    'ip' => $request->ip(),
                    'token_provided' => !empty($turnstileToken),
                ]);
                
                // Clear any session data that might have been created before the error
                // This prevents accumulation of session cookies from failed attempts
                if ($request->hasSession()) {
                    $request->session()->flush();
                }
                
                return $this->error('Security verification failed. Please try again.', 422);
            }
            
            Log::info('Turnstile verification successful', [
                'email' => $validated['email'],
                'ip' => $request->ip(),
            ]);
        }

        // Only pass email and password to Auth::attempt (not turnstile_token)
        $credentials = [
            'email' => $validated['email'],
            'password' => $validated['password'],
        ];

        Log::info('Attempting authentication', [
            'email' => $validated['email'],
        ]);

        if (! Auth::attempt($credentials, true)) {
            Log::warning('Authentication failed', [
                'email' => $validated['email'],
                'ip' => $request->ip(),
            ]);
            
            // Clear any session data on failed authentication to prevent cookie accumulation
            if ($request->hasSession()) {
                $request->session()->flush();
            }
            return $this->error('Invalid credentials', 422);
        }
        
        Log::info('Authentication successful', [
            'email' => $validated['email'],
            'user_id' => Auth::id(),
        ]);

        /** @var User $user */
        $user = $request->user();

        if ((int) ($user?->is_active ?? 0) === 0) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return $this->error('Account is banned.', 403);
        }

        if (method_exists($user, 'hasVerifiedEmail') && ! $user->hasVerifiedEmail()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return $this->error('Email not verified.', 403);
        }

        // If user has two-factor authentication enabled, do not complete login yet.
        // Instead, trigger a 2FA challenge and ask the client to verify via /api/v1/auth/2fa/verify.
        if ($user->two_factor_enabled && $user->two_factor_method) {
            // For email-based 2FA, generate and send a fresh code.
            if ($user->two_factor_method === 'email') {
                // Generate a 6-digit numeric code
                $code = random_int(100000, 999999);

                $user->two_factor_email_code = \Illuminate\Support\Facades\Hash::make((string) $code);
                $user->two_factor_email_expires_at = now()->addMinutes(10);
                $user->save();

                try {
                    $subject = config('app.name', 'Wisling') . ' - Login verification code';
                    $bodyLines = [
                        'Hi ' . ($user->name ?: $user->email) . ',',
                        '',
                        'Your login verification code is: ' . $code,
                        '',
                        'This code will expire in 10 minutes.',
                    ];

                    \Illuminate\Support\Facades\Mail::raw(
                        implode(PHP_EOL, $bodyLines),
                        function ($message) use ($user, $subject) {
                            $message->to($user->email)->subject($subject);
                        }
                    );
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to send login 2FA email code', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage(),
                    ]);

                    Auth::guard('web')->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return $this->error('Failed to send verification code. Please try again later.', 500);
                }

                app(AuditLogger::class)->log($request, 'auth.login.2fa_challenge', 'User', $user->id, [
                    'method' => 'email',
                ]);
            } else {
                // App-based 2FA: no email is sent; the user should use their authenticator app.
                app(AuditLogger::class)->log($request, 'auth.login.2fa_challenge', 'User', $user->id, [
                    'method' => 'app',
                ]);
            }

            // Log out the user so session is not considered authenticated until 2FA is verified.
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return $this->success([
                'two_factor_required' => true,
                'two_factor_method' => $user->two_factor_method,
                'email' => $user->email,
            ], 'Two-factor authentication required.');
        }

        // Regenerate session ID to prevent session fixation attacks
        // Only regenerate on successful login to avoid creating unnecessary session cookies
        $request->session()->regenerate();
        
        app(AuditLogger::class)->log($request, 'auth.login');
        return $this->success(null, 'Logged in');
    }

    public function logout(Request $request)
    {
        // Clear all session data before invalidating
        $request->session()->flush();
        
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        // Create response with success data
        $response = $this->success(null, 'Logged out');
        
        // Clear session cookie explicitly by setting it to expire
        $cookieName = config('session.cookie');
        $cookiePath = config('session.path', '/');
        $cookieDomain = config('session.domain');
        
        // Clear session cookie with proper attributes
        $response->cookie($cookieName, '', -2628000, $cookiePath, $cookieDomain, config('session.secure', false), config('session.http_only', true), false, config('session.same_site', 'lax'));
        
        // Clear XSRF token cookie
        $response->cookie('XSRF-TOKEN', '', -2628000, $cookiePath, $cookieDomain, config('session.secure', false), false, false, config('session.same_site', 'lax'));
        
        app(AuditLogger::class)->log($request, 'auth.logout');
        return $response;
    }

    public function me(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        return $this->success([
            // Model already appends `avatar_url` accessor
            'user' => $user->load(['roles', 'permissions'])->toArray(),
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'is_admin' => $user->hasRole('admin'),
        ]);
    }

    /**
     * Check if user has specific permission
     */
    public function checkPermission(Request $request, string $permission)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401, ['has_permission' => false, 'permission' => $permission]);
        }

        return $this->success([
            'has_permission' => $user->can($permission),
            'permission' => $permission,
        ]);
    }

    /**
     * Check if user has specific role
     */
    public function checkRole(Request $request, string $role)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401, ['has_role' => false, 'role' => $role]);
        }

        return $this->success([
            'has_role' => $user->hasRole($role),
            'role' => $role,
        ]);
    }

    /**
     * Get user capabilities for frontend
     */
    public function capabilities(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        return $this->success([
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'is_admin' => $user->hasRole('admin'),
            'can_manage_users' => $user->can('users.view'),
            'can_manage_roles' => $user->hasRole('admin'),
            'can_manage_permissions' => $user->hasRole('admin'),
        ]);
    }

    /**
     * Public: Check if an email already exists
     */
    public function checkEmailExists(CheckEmailRequest $request)
    {
        $exists = User::query()->where('email', $request->input('email'))->exists();

        return $this->success([
            'exists' => $exists,
            'field' => 'email',
        ], $exists ? 'Email already exists.' : 'Email is available.');
    }

    /**
     * Public: Check if a phone already exists
     */
    public function checkPhoneExists(CheckPhoneRequest $request)
    {
        $exists = User::query()->where('phone', $request->input('phone'))->exists();

        return $this->success([
            'exists' => $exists,
            'field' => 'phone',
        ], $exists ? 'Phone already exists.' : 'Phone is available.');
    }

    /**
     * Public: Check if a company name already exists
     */
    public function checkCompanyNameExists(CheckCompanyNameRequest $request)
    {
        $companyName = trim($request->input('companyName'));
        $exists = User::query()
            ->whereRaw('LOWER(TRIM(company_name)) = ?', [strtolower($companyName)])
            ->exists();

        return $this->success([
            'exists' => $exists,
            'field' => 'companyName',
        ], $exists ? 'Company name already exists.' : 'Company name is available.');
    }

    /**
     * Public: Sign up new user and create order
     */
    public function signup(SignupRequest $request)
    {
        try {
            DB::beginTransaction();

            // Get settings for price and VAT
            $settings = AdminSettingsController::getAllSettings();
            if (!$settings) {
                return $this->error('Settings not found', 500);
            }

            // EU countries that have VAT (including Sweden for VAT calculation, but Sweden doesn't require VAT number)
            $euCountries = [
                'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
                'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
                'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
                'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
            ];

            // Calculate VAT based on country
            $selectedCountry = $request->input('country');
            
            // Validate country is provided
            if (empty($selectedCountry)) {
                Log::warning('Country is empty or missing in signup request', [
                    'all_inputs' => array_keys($request->all()),
                    'country_value' => $selectedCountry,
                ]);
            }
            
            // Normalize country name (trim whitespace and handle null/empty)
            $selectedCountryNormalized = $selectedCountry ? trim((string) $selectedCountry) : '';
            
            // Check if country is in EU list (case-sensitive exact match)
            $isEUCountry = !empty($selectedCountryNormalized) && in_array($selectedCountryNormalized, $euCountries, true);
            $isSweden = $selectedCountryNormalized === 'Sweden';
            
            // Get VAT number if provided
            $vatNumber = $request->input('vatNumber');
            $hasVatNumber = !empty($vatNumber) && trim((string) $vatNumber) !== '';
            
            // VAT calculation rules:
            // 1. Swedish customers: Always pay VAT (regardless of VAT number)
            // 2. EU countries (non-Swedish): Pay VAT only if no VAT number provided
            // 3. Non-EU countries: No VAT
            $vatPercentage = 0;
            if ($isSweden) {
                // Swedish customers always pay VAT
                $vatPercentage = (float) $settings->vat;
            } elseif ($isEUCountry && !$hasVatNumber) {
                // EU countries (non-Swedish) pay VAT only if no VAT number
                $vatPercentage = (float) $settings->vat;
            }
            
            // Calculate VAT amount in currency: price * (VAT percentage / 100)
            // Example: 1000 * (25 / 100) = 250
            $vatAmount = ($settings->price * $vatPercentage) / 100;
            
            // Log for debugging (only if country is provided to avoid log spam)
            if (!empty($selectedCountryNormalized)) {
                Log::info('Signup VAT calculation', [
                    'selected_country' => $selectedCountryNormalized,
                    'is_eu_country' => $isEUCountry,
                    'is_sweden' => $isSweden,
                    'has_vat_number' => $hasVatNumber,
                    'vat_percentage' => $vatPercentage,
                    'vat_amount' => $vatAmount,
                    'price' => $settings->price,
                    'settings_vat' => $settings->vat,
                ]);
            }

            // Generate temporary password for welcome email
            $temporaryPassword = 'temporary_' . Str::random(10);

            // Generate company slug from company name
            $companyName = $request->input('companyName');
            $companySlug = $companyName ? Str::slug($companyName) : null;

            // Get user language preference (default to 'en' if not provided)
            $userLanguage = $request->input('user_language', 'en');
            // Validate language code
            $supportedLanguages = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
            if (!in_array($userLanguage, $supportedLanguages, true)) {
                $userLanguage = 'en'; // Fallback to English if invalid
            }

            // Create user
            $user = User::create([
                'first_name' => $request->input('firstName'),
                'last_name' => $request->input('lastName'),
                'name' => $request->input('firstName') . ' ' . $request->input('lastName'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'company_name' => $companyName,
                'company_number' => $request->input('companyNumber'),
                'company_slug' => $companySlug,
                'address' => $request->input('address'),
                'city' => $request->input('city'),
                'country' => $request->input('country'),
                'vat_number' => $request->input('vatNumber'),
                'user_language' => $userLanguage,
                'password' => Hash::make($temporaryPassword), // Temporary password, can be updated via email
                'initial_password' => $temporaryPassword, // Store as plain text (not encrypted)
                'is_active' => 1,
            ]);

            // Assign company role - ensure role exists first
            try {
                $companyRole = Role::where('name', 'company')->first();
                if ($companyRole) {
                    $user->assignRole($companyRole);
                    Log::info('Company role assigned to user', [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'role_id' => $companyRole->id,
                    ]);
                } else {
                    // If role doesn't exist, create it (fallback) - match seeder pattern
                    Log::warning('Company role not found, creating it', ['user_id' => $user->id]);
                    $companyRole = Role::firstOrCreate(['name' => 'company']);
                    $user->assignRole($companyRole);
                    Log::info('Company role created and assigned to user', [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'role_id' => $companyRole->id,
                    ]);
                }
                
                // Refresh user to ensure roles are loaded
                $user->refresh();
                $user->load('roles');
                
                // Verify role was assigned
                if (!$user->hasRole('company')) {
                    Log::error('Failed to assign company role to user', [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'roles' => $user->getRoleNames()->toArray(),
                    ]);
                    throw new \Exception('Failed to assign company role to user');
                }
            } catch (\Exception $e) {
                Log::error('Error assigning company role', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e; // Re-throw to trigger transaction rollback
            }

            // Handle payment attachment upload for bank transfer
            $paymentAttachmentPath = null;
            if ($request->input('paymentMethod') === 'bank' && $request->hasFile('paymentAttachment')) {
                $paymentAttachmentPath = $request->file('paymentAttachment')->store('payment_attachments', 'public');
            }

            // Set locale based on user's language preference for order title translation
            App::setLocale($userLanguage);
            $subscriptionTitle = __('invoice.subscription_title');

            // Create order with country-based VAT
            $order = Order::create([
                'created_by' => null,
                'company_id' => $user->id,
                'invoice_number' => Order::generateInvoiceNumber(),
                'status' => 'pending',
                'invoice_date' => now()->toDateString(),
                'title' => $subscriptionTitle,
                'price' => $settings->price,
                'vat' => $vatAmount, // Use calculated VAT amount (not percentage)
                'payment_type' => $request->input('paymentMethod') === 'card' ? 'stripe' : 'bank_transfer',
                'payment_response' => null,
                'payment_attachment' => $paymentAttachmentPath,
            ]);

            DB::commit();

            // Load order with company relationship
            $order->load('company');
            
            // Notify admin about new company registration
            try {
                app(\App\Services\NotificationService::class)->notifyCompanyRegistered($user);
            } catch (\Exception $e) {
                Log::warning('Failed to send company registration notification', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Return different response based on payment method
            if ($request->input('paymentMethod') === 'card') {
                // For Stripe payment: Don't send emails here, wait for payment verification
                // Create Stripe Checkout Session
                $stripeService = new StripeService();
                
                $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
                $successUrl = $frontendUrl . '/signup-success?session_id={CHECKOUT_SESSION_ID}&order_id=' . $order->id;
                $cancelUrl = $frontendUrl . '/sign-up?step=3&error=payment_cancelled';
                
                try {
                    $session = $stripeService->createCheckoutSession($order, $successUrl, $cancelUrl);
                    
                    return $this->success([
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'payment_method' => 'stripe',
                        'checkout_url' => $session->url,
                        'session_id' => $session->id,
                    ], 'User created. Redirecting to Stripe checkout.');
                } catch (\Exception $e) {
                    Log::error('Stripe checkout creation failed: ' . $e->getMessage());
                    return $this->error('Failed to create Stripe checkout session. Please try again or use bank transfer.', 500);
                }
            }

            // For bank transfer: Send emails immediately
            // Send welcome email with invoice PDF attachment
            $this->sendWelcomeEmailWithInvoice($user, $order);
            
            // Send invoice email separately to company - DISABLED
            // $this->sendInvoiceEmail($user, $order);

            // Notify admins about the payment
            $this->sendAdminPaymentEmail($user, $order);

            // Send account verification email - DISABLED (verification link now included in Welcome Email)
            // $this->sendAccountVerificationEmail($user);

            return $this->success([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'payment_method' => 'bank_transfer',
                'invoice_number' => $order->invoice_number,
            ], 'User created. Your account will be activated once payment is verified.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Signup error: ' . $e->getMessage());
            return $this->error('Failed to create user: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send welcome email with invoice PDF attachment
     */
    private function sendWelcomeEmailWithInvoice(User $user, Order $order): void
    {
        try {
            // Generate verification link for Welcome Email
            $verificationUrl = null;
            if (!$user->hasVerifiedEmail()) {
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
                } catch (\Throwable $e) {
                    Log::warning('Failed to generate verification URL for welcome email', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Get welcome email template by name and user language (fallback to English)
            $userLanguage = $user->user_language ?? 'en';
            $welcomeTemplate = EmailTemplate::getByNameAndLanguage('Welcome Email', $userLanguage, true);
            if ($welcomeTemplate && $welcomeTemplate->status === 'active') {
                $welcomeContent = $this->replaceEmailPlaceholders($welcomeTemplate->content, $user, $order, $verificationUrl);
                $welcomeSubject = $this->replaceEmailPlaceholders($welcomeTemplate->subject, $user, $order, $verificationUrl);
                
                Log::info('Sending welcome email with invoice', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'user_language' => $userLanguage,
                    'template_language' => $welcomeTemplate->language,
                    'template_id' => $welcomeTemplate->id,
                ]);
                
                Log::debug('Dispatching WelcomeEmailWithInvoice with template', [
                    'user_email' => $user->email,
                    'subject' => $welcomeSubject,
                ]);

                // Queue email for asynchronous delivery
                Mail::to($user->email)->queue(
                    new WelcomeEmailWithInvoice($user, $order, $welcomeContent, $welcomeSubject)
                );
                
                Log::info('Welcome email sent successfully', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                ]);
            } else {
                Log::warning('Welcome email template not found or inactive', [
                    'template_name' => 'Welcome Email',
                    'template_exists' => (bool) $welcomeTemplate,
                    'template_status' => $welcomeTemplate?->status ?? 'not_found',
                    'user_id' => $user->id,
                    'user_language' => $userLanguage,
                    'fallback_language' => 'en',
                ]);

                $fallbackSubject = 'Welcome to ' . (config('app.name') ?? 'wisling');
                $fallbackContent = $this->replaceEmailPlaceholders(
                    '<p>Hi {{name}},</p><p>Thank you for subscribing to our platform. Your invoice number is {{invoice_number}}.</p>',
                    $user,
                    $order,
                    $verificationUrl
                );

                Log::debug('Dispatching WelcomeEmailWithInvoice fallback', [
                    'user_email' => $user->email,
                    'subject' => $fallbackSubject,
                ]);

                Mail::to($user->email)->queue(
                    new WelcomeEmailWithInvoice($user, $order, $fallbackContent, $fallbackSubject)
                );

                Log::info('Welcome email fallback sent successfully', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email with invoice: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send invoice email separately to company
     */
    private function sendInvoiceEmail(User $user, Order $order): void
    {
        try {
            // Get invoice email template by name and user language (fallback to English)
            $userLanguage = $user->user_language ?? 'en';
            $invoiceTemplate = EmailTemplate::getByNameAndLanguage('Invoice Email', $userLanguage, true);
            if ($invoiceTemplate && $invoiceTemplate->status === 'active') {
                $invoiceContent = $this->replaceEmailPlaceholders($invoiceTemplate->content, $user, $order);
                $invoiceSubject = $this->replaceEmailPlaceholders($invoiceTemplate->subject, $user, $order);
                
                Log::info('Sending invoice email', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                ]);
                
                Log::debug('Dispatching InvoiceEmail with template', [
                    'user_email' => $user->email,
                    'subject' => $invoiceSubject,
                ]);

                // Queue email for asynchronous delivery
                Mail::to($user->email)->queue(
                    new InvoiceEmail($user, $order, $invoiceContent, $invoiceSubject)
                );
                
                Log::info('Invoice email sent successfully', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                ]);
            } else {
                Log::warning('Invoice email template not found or inactive', [
                    'template_name' => 'Invoice Email',
                    'template_exists' => (bool) $invoiceTemplate,
                    'template_status' => $invoiceTemplate?->status ?? 'not_found',
                    'user_id' => $user->id,
                ]);

                $fallbackSubject = 'Your invoice ' . ($order->invoice_number ?? '');
                $fallbackContent = $this->replaceEmailPlaceholders(
                    '<p>Hi {{name}},</p><p>Please find your invoice #{{invoice_number}} attached.</p>',
                    $user,
                    $order
                );

                Log::debug('Dispatching InvoiceEmail fallback', [
                    'user_email' => $user->email,
                    'subject' => $fallbackSubject,
                ]);

                Mail::to($user->email)->queue(
                    new InvoiceEmail($user, $order, $fallbackContent, $fallbackSubject)
                );

                Log::info('Invoice email fallback sent successfully', [
                    'user_email' => $user->email,
                    'user_id' => $user->id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send invoice email: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send account verification email to the user.
     */
    private function sendAccountVerificationEmail(User $user): void
    {
        try {
            app(AccountVerificationEmailService::class)->send($user);
        } catch (\Throwable $e) {
            Log::error('Failed to send account verification email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function verifyEmail(Request $request, string $id, string $hash)
    {
        $user = User::find($id);

        if (!$user) {
            return $this->error('User not found', 404);
        }

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            $redirectUrl = $this->resolveVerificationRedirectUrl($request, false);

            if ($redirectUrl) {
                return redirect()->away($redirectUrl);
            }

            return $this->error('Invalid verification link', 403);
        }

        if (! $request->hasValidSignature()) {
            $redirectUrl = $this->resolveVerificationRedirectUrl($request, false);

            if ($redirectUrl) {
                return redirect()->away($redirectUrl);
            }

            return $this->error('Verification link has expired or is invalid', 403);
        }

        if ($user->hasVerifiedEmail()) {
            $redirectUrl = $this->resolveVerificationRedirectUrl($request, true);

            if ($redirectUrl) {
                return redirect()->away($redirectUrl);
            }

            return $this->success(null, 'Email already verified');
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ]);

        if ((int) $user->is_active === 2) {
            $user->is_active = 1;
        }

        $user->save();

        event(new Verified($user));

        // Check if user still has initial_password set - if yes, force them to set their own password
        // Users created during signup have initial_password set, which is cleared when they set their own password
        if (!empty($user->initial_password)) {
            try {
                // Generate a password set token for verified users
                $token = Password::broker('welcome')->createToken($user);
                $frontendBase = rtrim((string) (config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url')), '/');
                $setPasswordUrl = $frontendBase.'/auth/set-password?token='.$token.'&email='.urlencode($user->email);
                
                $redirectUrl = $setPasswordUrl;
                
                if ($redirectUrl) {
                    return redirect()->away($redirectUrl);
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to generate password set token after email verification', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $redirectUrl = $this->resolveVerificationRedirectUrl($request, true);

        if ($redirectUrl) {
            return redirect()->away($redirectUrl);
        }

        return $this->success(null, 'Email verified successfully');
    }

    /**
     * Request password set token for verified users without password
     */
    public function requestPasswordSetToken(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            // Don't reveal if user exists or not for security
            return $this->success(null, 'If the email exists and needs to set password, a link has been sent.');
        }

        // Only allow if user is verified but still has initial_password set
        if (is_null($user->email_verified_at)) {
            return $this->error('Please verify your email first.', 422);
        }

        if (empty($user->initial_password)) {
            return $this->error('Password already set for this account.', 409);
        }

        try {
            $token = Password::broker('welcome')->createToken($user);
            $frontendBase = rtrim((string) (config('app.frontend_url') ?? env('FRONTEND_URL') ?? config('app.url')), '/');
            $setPasswordUrl = $frontendBase.'/auth/set-password?token='.$token.'&email='.urlencode($user->email);
            
            // Send email with password set link
            Mail::to($user->email)->queue((new WelcomeSetPasswordMail($user, $setPasswordUrl))->delay(now()->addSeconds(5)));
            
            app(AuditLogger::class)->log($request, 'auth.password.set.request', 'User', $user->id, [
                'user_email' => $user->email,
            ]);
            
            return $this->success(null, 'Password set link has been sent to your email.');
        } catch (\Throwable $e) {
            Log::error('Failed to send password set token', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            return $this->error('Failed to send password set link. Please try again later.', 500);
        }
    }

    /**
     * Resend verification email to user
     */
    public function resendVerificationEmail(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            // Don't reveal if user exists or not for security
            return $this->success(null, 'If the email exists and is not verified, a verification email has been sent.');
        }

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, 'Email is already verified.');
        }

        try {
            $this->sendAccountVerificationEmail($user);
            app(AuditLogger::class)->log($request, 'auth.verification.resend', 'User', $user->id, [
                'user_email' => $user->email,
            ]);
            return $this->success(null, 'Verification email sent successfully.');
        } catch (\Throwable $e) {
            Log::error('Failed to resend verification email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            return $this->error('Failed to send verification email. Please try again later.', 500);
        }
    }

    private function resolveVerificationRedirectUrl(Request $request, bool $success): ?string
    {
        $redirect = $request->query('redirect');

        if (is_string($redirect) && trim($redirect) !== '') {
            $separator = str_contains($redirect, '?') ? '&' : '?';

            return $redirect . $separator . 'verified=' . ($success ? '1' : '0');
        }

        $frontendBase = config('app.frontend_url') ?? env('FRONTEND_URL') ?? null;

        if ($frontendBase) {
            return rtrim((string) $frontendBase, '/') . '/auth/sign-in?verified=' . ($success ? '1' : '0');
        }

        return null;
    }

    /**
     * Replace placeholders in email template content
     * Made public so it can be accessed from OrderController
     * Supports both {{placeholder}} and [Placeholder] formats
     */
    public function replaceEmailPlaceholders(string $content, User $user, Order $order, ?string $verificationUrl = null): string
    {
        // Build replacements array
        $password = '';

        if (!empty($user->initial_password)) {
            // initial_password is stored as plain text (not encrypted)
            $password = $user->initial_password;
        }

        if ($password === '') {
            $password = 'Set via verification link';
        }

        $paymentTypeRaw = $order->payment_type ?? '';
        $paymentType = $paymentTypeRaw !== ''
            ? Str::title(str_replace('_', ' ', $paymentTypeRaw))
            : 'Bank Transfer'; // Default fallback for payment type

        $paymentAttachmentUrl = '';
        if (!empty($order->payment_attachment)) {
            try {
                $storageUrl = Storage::url($order->payment_attachment);
                if (!empty($storageUrl)) {
                    $paymentAttachmentUrl = Str::startsWith($storageUrl, ['http://', 'https://'])
                        ? $storageUrl
                        : URL::to($storageUrl);
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to resolve payment attachment URL for email placeholders', [
                    'order_id' => $order->id,
                    'payment_attachment' => $order->payment_attachment,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $downloadPaymentSlipLink = $paymentAttachmentUrl !== ''
            ? '<a href="' . e($paymentAttachmentUrl) . '">Download Payment Slip</a>'
            : 'N/A';

        // Ensure user name is never empty
        $userName = !empty($user->name) ? $user->name : ($user->company_name ?? $user->email ?? 'User');

        $replacements = [
            // Name variations (support both formats)
            '[Username]' => $userName,
            '[username]' => $userName,
            '{{name}}' => $userName,
            '{{Name}}' => $userName,
            '{{NAME}}' => $userName,
            // Email variations
            '[Email]' => $user->email,
            '[email]' => $user->email,
            '{{email}}' => $user->email,
            '{{Email}}' => $user->email,
            // Password variations
            '[Password]' => $password,
            '[password]' => $password,
            '{{password}}' => $password,
            '{{Password}}' => $password,
            '{{PASSWORD}}' => $password,
            // Company variations
            '[Company Name]' => $user->company_name ?? $user->name,
            '[Company name]' => $user->company_name ?? $user->name,
            '[company_name]' => $user->company_name ?? $user->name,
            '[Company]' => $user->company_name ?? $user->name,
            '[company]' => $user->company_name ?? $user->name,
            '{{company_name}}' => $user->company_name ?? $user->name,
            '{{company}}' => $user->company_name ?? $user->name,
            // Contact info
            '[Phone]' => $user->phone ?? '',
            '[phone]' => $user->phone ?? '',
            '{{phone}}' => $user->phone ?? '',
            '[Address]' => $user->address ?? '',
            '[address]' => $user->address ?? '',
            '{{address}}' => $user->address ?? '',
            '[City]' => $user->city ?? '',
            '[city]' => $user->city ?? '',
            '{{city}}' => $user->city ?? '',
            '[Country]' => $user->country ?? '',
            '[country]' => $user->country ?? '',
            '{{country}}' => $user->country ?? '',
            // Invoice variations
            '[Invoice Number]' => $order->invoice_number,
            '[invoice_number]' => $order->invoice_number,
            '{{invoice_number}}' => $order->invoice_number,
            '{{Invoice Number}}' => $order->invoice_number,
            '[Invoice Date]' => $order->invoice_date ? (\Carbon\Carbon::parse($order->invoice_date)->format('Y-m-d')) : $order->created_at->format('Y-m-d'),
            '[invoice_date]' => $order->invoice_date ? (\Carbon\Carbon::parse($order->invoice_date)->format('Y-m-d')) : $order->created_at->format('Y-m-d'),
            '{{invoice_date}}' => $order->invoice_date ? (\Carbon\Carbon::parse($order->invoice_date)->format('Y-m-d')) : $order->created_at->format('Y-m-d'),
            // Amount variations
            '[Amount]' => number_format((float) $order->price + (float) $order->vat, 2),
            '[amount]' => number_format((float) $order->price + (float) $order->vat, 2),
            '{{amount}}' => number_format((float) $order->price + (float) $order->vat, 2),
            '[Total]' => number_format((float) $order->price + (float) $order->vat, 2),
            '[total]' => number_format((float) $order->price + (float) $order->vat, 2),
            '{{total}}' => number_format((float) $order->price + (float) $order->vat, 2),
            '[Price]' => number_format((float) $order->price, 2),
            '[price]' => number_format((float) $order->price, 2),
            '{{price}}' => number_format((float) $order->price, 2),
            '[VAT]' => number_format((float) $order->vat, 2),
            '[vat]' => number_format((float) $order->vat, 2),
            '{{vat}}' => number_format((float) $order->vat, 2),
            // Payment details
            '[Payment Type]' => $paymentType,
            '[payment_type]' => $paymentType,
            '[paymentType]' => $paymentType,
            '{{payment_type}}' => $paymentType,
            '{{Payment Type}}' => $paymentType,
            '{{paymentType}}' => $paymentType,
            '[Download Payment SLIP]' => $downloadPaymentSlipLink,
            '[download_payment_slip]' => $downloadPaymentSlipLink,
            '[downloadPaymentSlip]' => $downloadPaymentSlipLink,
            '{{download_payment_slip}}' => $downloadPaymentSlipLink,
            '{{Download Payment Slip}}' => $downloadPaymentSlipLink,
            '{{downloadPaymentSlip}}' => $downloadPaymentSlipLink,
            '%download_payment_slip%' => $downloadPaymentSlipLink,
            // Verification link variations
            '[verification_link]' => $verificationUrl ?? '',
            '[Verification Link]' => $verificationUrl ?? '',
            '[Verification_link]' => $verificationUrl ?? '',
            '{{verification_link}}' => $verificationUrl ?? '',
            '{{Verification Link}}' => $verificationUrl ?? '',
            '{{verificationLink}}' => $verificationUrl ?? '',
        ];

        // Replace all placeholders
        return str_replace(array_keys($replacements), array_values($replacements), $content);
    }

    /**
     * Send payment notification email to all admins
     */
    private function sendAdminPaymentEmail(User $user, Order $order): void
    {
        try {
            // Use getByNameAndLanguage for consistency with other email sending methods
            // Default to 'en' since this is an admin notification email
            $template = EmailTemplate::getByNameAndLanguage('Payment Email Admin', 'en', true);

            if (!$template) {
                Log::warning('Payment Email Admin template not found or inactive', [
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                ]);
                return;
            }

            $adminRecipients = User::role('admin')
                ->whereNotNull('email')
                ->get();

            if ($adminRecipients->isEmpty()) {
                Log::warning('No admin recipients found for payment notification email', [
                    'order_id' => $order->id,
                ]);
                return;
            }

            // Replace placeholders in template content and subject
            $emailContent = $this->replaceEmailPlaceholders($template->content, $user, $order);
            $emailSubject = $this->replaceEmailPlaceholders($template->subject, $user, $order);

            // Log for debugging if placeholders still exist after replacement
            if (str_contains($emailContent, '[Username]') || str_contains($emailContent, '[Payment Type]') || str_contains($emailContent, '[Download Payment SLIP]')) {
                Log::warning('Payment notification email still contains unreplaced placeholders', [
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'template_id' => $template->id,
                ]);
            }

            foreach ($adminRecipients as $admin) {
                try {
                    Mail::to($admin->email)->queue(
                        new AdminPaymentNotificationMail($user, $order, $emailSubject, $emailContent)
                    );
                } catch (\Throwable $mailException) {
                    Log::error('Failed to send admin payment email to recipient', [
                        'admin_id' => $admin->id,
                        'admin_email' => $admin->email,
                        'order_id' => $order->id,
                        'error' => $mailException->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Failed to prepare admin payment notification email', [
                'user_id' => $user->id,
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}


