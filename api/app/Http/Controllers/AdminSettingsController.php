<?php

namespace App\Http\Controllers;

use App\Models\AdminSettings;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\AdminSettings\UpdateStripeConfigurationRequest;
use App\Http\Requests\AdminSettings\UpdateBankDetailsRequest;
use App\Http\Requests\AdminSettings\UpdateBasicConfigurationRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdminSettingsController extends Controller
{
    use ApiResponse, AuthorizesRequests;

    /**
     * Get admin settings (public endpoint for signup)
     * Returns VAT rate and subscription price
     */
    public function getSettings()
    {
        try {
            // Get the first (and should be only) admin settings record
            $settings = AdminSettings::first();

            if (!$settings) {
                // Return default values if no settings found
                return $this->success([
                    'vat' => 25.00,
                    'price' => 1000.00,
                    'vat_percentage' => 25,
                ], 'Default settings returned');
            }

            // VAT is stored as a percentage (e.g., 25 for 25%), not as an amount
            return $this->success([
                'vat' => (float) $settings->vat, // VAT percentage (e.g., 25 for 25%)
                'price' => (float) $settings->price,
                'vat_percentage' => (int) $settings->vat, // Same as vat, for compatibility
            ], 'Settings retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve settings', 500);
        }
    }

    /**
     * Get specific setting value by key (reusable helper)
     * 
     * @param string $key
     * @return mixed|null
     */
    public static function getSetting(string $key)
    {
        $settings = AdminSettings::first();
        
        if (!$settings) {
            return null;
        }

        return $settings->{$key} ?? null;
    }

    /**
     * Get all settings (reusable helper)
     * 
     * @return AdminSettings|null
     */
    public static function getAllSettings()
    {
        return AdminSettings::first();
    }

    /**
     * Get Basic configuration
     */
    public function getBasicConfiguration(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdminSettings::class);

        $settings = AdminSettings::first();

        if (!$settings) {
            return $this->success([
                'logo' => null,
                'small_logo' => null,
                'open_state_deadline_days' => 0,
                'close_state_deadline_days' => 0,
                'vat' => 0,
                'price' => 0,
                'phone_hours_from' => '09:00',
                'phone_hours_to' => '18:00',
                'invoice_note' => '',
                'delete_closed_cases' => false,
                'delete_closed_cases_period' => null,
                'delete_closed_cases_period_type' => null,
            ], 'Default basic configuration');
        }

        $logoUrl = $settings->logo ? Storage::url($settings->logo) : null;
        $smallLogoUrl = $settings->small_logo ? Storage::url($settings->small_logo) : null;
        return $this->success([
            'logo' => $logoUrl,
            'small_logo' => $smallLogoUrl,
            'open_state_deadline_days' => (int) ($settings->open_state_deadline_days ?? 0),
            'close_state_deadline_days' => (int) ($settings->close_state_deadline_days ?? 0),
            'vat' => (float) ($settings->vat ?? 0),
            'price' => (float) ($settings->price ?? 0),
            'phone_hours_from' => $settings->phone_hours_from ? substr($settings->phone_hours_from, 0, 5) : '09:00',
            'phone_hours_to' => $settings->phone_hours_to ? substr($settings->phone_hours_to, 0, 5) : '18:00',
            'invoice_note' => $settings->invoice_note ?? '',
            'delete_closed_cases' => (bool) ($settings->delete_closed_cases ?? false),
            'delete_closed_cases_period' => $settings->delete_closed_cases_period ? (int) $settings->delete_closed_cases_period : null,
            'delete_closed_cases_period_type' => $settings->delete_closed_cases_period_type ?? null,
            ], 'Basic configuration retrieved successfully');
    }

    /**
     * Get Stripe configuration
     */
    public function getStripeConfiguration(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdminSettings::class);

        $settings = AdminSettings::first();

        if (!$settings) {
            return $this->success([
                'stripe_client_id' => '',
                'stripe_secret_key' => '',
                'stripe_webhook_secret' => '',
            ], 'Default Stripe configuration');
        }

        return $this->success([
            'stripe_client_id' => $settings->stripe_client_id ?? '',
            'stripe_secret_key' => $settings->stripe_secret_key ?? '',
            'stripe_webhook_secret' => $settings->stripe_webhook_secret ?? '',
        ], 'Stripe configuration retrieved successfully');
    }

    /**
     * Get Bank details
     */
    public function getBankDetails(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AdminSettings::class);

        $settings = AdminSettings::first();

        if (!$settings) {
            return $this->success([
                'iban' => '',
                'bic_code' => '',
                'bank_account' => '',
            ], 'Default bank details');
        }

        return $this->success([
            'iban' => $settings->iban ?? '',
            'bic_code' => $settings->bic_code ?? '',
            'bank_account' => $settings->bank_account ?? '',
        ], 'Bank details retrieved successfully');
    }

    /**
     * Update .env file with Stripe configuration
     */
    private function updateStripeEnvFile(array $data): void
    {
        $envFile = base_path('.env');

        if (!File::exists($envFile)) {
            return;
        }

        try {
            $envContent = File::get($envFile);
            $lines = explode("\n", $envContent);

            // Map database fields to env variables
            $envMappings = [
                'stripe_client_id' => 'STRIPE_PUBLIC_KEY',
                'stripe_secret_key' => 'STRIPE_SECRET_KEY',
                'stripe_webhook_secret' => 'STRIPE_WEBHOOK_SECRET',
            ];

            foreach ($lines as &$line) {
                foreach ($envMappings as $dbField => $envKey) {
                    if (array_key_exists($dbField, $data) && str_starts_with($line, $envKey . '=')) {
                        $line = $envKey . '=' . $data[$dbField];
                        break;
                    }
                }
            }

            $updatedContent = implode("\n", $lines);
            File::put($envFile, $updatedContent);
        } catch (\Exception $e) {
            // Log the error but don't fail the entire operation
            Log::error('Failed to update .env file with Stripe configuration: ' . $e->getMessage());
        }
    }

    /**
     * Update Stripe configuration
     */
    public function updateStripeConfiguration(UpdateStripeConfigurationRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $settings = AdminSettings::first();

            if (!$settings) {
                // Create new settings if none exist
                $settings = new AdminSettings();
            }

            $oldData = [
                'stripe_client_id' => $settings->stripe_client_id,
                'stripe_secret_key' => '***', // Don't log actual secret
                'stripe_webhook_secret' => '***', // Don't log actual secret
            ];

            // Update only the fields that are provided
            if (array_key_exists('stripe_client_id', $data)) {
                $settings->stripe_client_id = $data['stripe_client_id'];
            }
            if (array_key_exists('stripe_secret_key', $data)) {
                $settings->stripe_secret_key = $data['stripe_secret_key'];
            }
            if (array_key_exists('stripe_webhook_secret', $data)) {
                $settings->stripe_webhook_secret = $data['stripe_webhook_secret'];
            }

            $settings->save();

            // Update .env file with the new Stripe configuration
            $this->updateStripeEnvFile($data);

            app(AuditLogger::class)->log($request, 'stripe_configuration.updated', 'AdminSettings', $settings->id, [
                'old' => $oldData,
                'new' => [
                    'stripe_client_id' => $settings->stripe_client_id,
                    'stripe_secret_key' => '***',
                    'stripe_webhook_secret' => '***',
                ],
            ]);

            return $this->success([
                'stripe_client_id' => $settings->stripe_client_id ?? '',
                'stripe_secret_key' => $settings->stripe_secret_key ?? '',
                'stripe_webhook_secret' => $settings->stripe_webhook_secret ?? '',
            ], 'Stripe configuration updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to save configuration: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update Bank details
     */
    public function updateBankDetails(UpdateBankDetailsRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $settings = AdminSettings::first();
            if (!$settings) {
                $settings = new AdminSettings();
            }

            $oldData = [
                'iban' => $settings->iban,
                'bic_code' => $settings->bic_code,
                'bank_account' => $settings->bank_account,
            ];

            if (array_key_exists('iban', $data)) {
                $settings->iban = $data['iban'];
            }
            if (array_key_exists('bic_code', $data)) {
                $settings->bic_code = $data['bic_code'];
            }
            if (array_key_exists('bank_account', $data)) {
                $settings->bank_account = $data['bank_account'];
            }

            $settings->save();

            app(AuditLogger::class)->log($request, 'bank_details.updated', 'AdminSettings', $settings->id, [
                'old' => $oldData,
                'new' => [
                    'iban' => $settings->iban,
                    'bic_code' => $settings->bic_code,
                    'bank_account' => $settings->bank_account,
                ],
            ]);

            return $this->success([
                'iban' => $settings->iban ?? '',
                'bic_code' => $settings->bic_code ?? '',
                'bank_account' => $settings->bank_account ?? '',
            ], 'Bank details updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to save bank details: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update Basic configuration
     */
    public function updateBasicConfiguration(UpdateBasicConfigurationRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $settings = AdminSettings::first();
            if (!$settings) {
                $settings = new AdminSettings();
            }

            $oldData = [
                'logo' => $settings->logo,
                'small_logo' => $settings->small_logo,
                'open_state_deadline_days' => $settings->open_state_deadline_days,
                'close_state_deadline_days' => $settings->close_state_deadline_days,
                'vat' => $settings->vat,
                'price' => $settings->price,
                'phone_hours_from' => $settings->phone_hours_from,
                'phone_hours_to' => $settings->phone_hours_to,
                'invoice_note' => $settings->invoice_note,
                'delete_closed_cases' => $settings->delete_closed_cases,
                'delete_closed_cases_period' => $settings->delete_closed_cases_period,
                'delete_closed_cases_period_type' => $settings->delete_closed_cases_period_type,
            ];

            // Handle optional base64 logo data URL (data:image/...;base64,xxxx)
            if (!empty($data['logo'])) {
                $logo = $data['logo'];
                if (str_starts_with($logo, 'data:image')) {
                    $path = 'logos/'.uniqid('logo_').'.png';
                    $base64 = substr($logo, strpos($logo, ',') + 1);
                    Storage::disk('public')->put($path, base64_decode($base64));
                    $settings->logo = $path;
                } else {
                    // Assume it's an existing relative path
                    $settings->logo = $logo;
                }
            }

            // Handle optional base64 small logo data URL (data:image/...;base64,xxxx)
            if (!empty($data['small_logo'])) {
                $smallLogo = $data['small_logo'];
                if (str_starts_with($smallLogo, 'data:image')) {
                    $path = 'logos/'.uniqid('small_logo_').'.png';
                    $base64 = substr($smallLogo, strpos($smallLogo, ',') + 1);
                    Storage::disk('public')->put($path, base64_decode($base64));
                    $settings->small_logo = $path;
                } else {
                    // Assume it's an existing relative path
                    $settings->small_logo = $smallLogo;
                }
            }

            $settings->open_state_deadline_days = $data['open_state_deadline_days'];
            $settings->close_state_deadline_days = $data['close_state_deadline_days'];
            $settings->vat = $data['vat'];
            $settings->price = $data['price'];
            $settings->phone_hours_from = $data['phone_hours_from'];
            $settings->phone_hours_to = $data['phone_hours_to'];
            $settings->invoice_note = $data['invoice_note'] ?? null;
            $settings->delete_closed_cases = $data['delete_closed_cases'];
            $settings->delete_closed_cases_period = $data['delete_closed_cases'] ? ($data['delete_closed_cases_period'] ?? null) : null;
            $settings->delete_closed_cases_period_type = $data['delete_closed_cases'] ? ($data['delete_closed_cases_period_type'] ?? null) : null;

            $settings->save();

            app(AuditLogger::class)->log($request, 'basic_configuration.updated', 'AdminSettings', $settings->id, [
                'old' => $oldData,
                'new' => [
                    'logo' => $settings->logo,
                    'small_logo' => $settings->small_logo,
                    'open_state_deadline_days' => $settings->open_state_deadline_days,
                    'close_state_deadline_days' => $settings->close_state_deadline_days,
                    'vat' => $settings->vat,
                    'price' => $settings->price,
                    'phone_hours_from' => $settings->phone_hours_from,
                    'phone_hours_to' => $settings->phone_hours_to,
                    'invoice_note' => $settings->invoice_note,
                    'delete_closed_cases' => $settings->delete_closed_cases,
                    'delete_closed_cases_period' => $settings->delete_closed_cases_period,
                    'delete_closed_cases_period_type' => $settings->delete_closed_cases_period_type,
                ],
            ]);

            $logoUrl = $settings->logo ? Storage::url($settings->logo) : null;
            $smallLogoUrl = $settings->small_logo ? Storage::url($settings->small_logo) : null;
            return $this->success([
                'logo' => $logoUrl,
                'small_logo' => $smallLogoUrl,
                'open_state_deadline_days' => (int) $settings->open_state_deadline_days,
                'close_state_deadline_days' => (int) $settings->close_state_deadline_days,
                'vat' => (float) $settings->vat,
                'price' => (float) $settings->price,
                'phone_hours_from' => substr($settings->phone_hours_from, 0, 5),
                'phone_hours_to' => substr($settings->phone_hours_to, 0, 5),
                'invoice_note' => $settings->invoice_note ?? '',
                'delete_closed_cases' => (bool) $settings->delete_closed_cases,
                'delete_closed_cases_period' => $settings->delete_closed_cases_period ? (int) $settings->delete_closed_cases_period : null,
                'delete_closed_cases_period_type' => $settings->delete_closed_cases_period_type ?? null,
            ], 'Basic configuration updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to save basic configuration: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get site logo (public, no auth required)
     */
    public function getSiteLogo(): JsonResponse
    {
        $settings = AdminSettings::first();

        $logoUrl = $settings && $settings->logo ? Storage::url($settings->logo) : null;
        
        return $this->success([
            'logo' => $logoUrl,
        ]);
    }

    /**
     * Get small logo for favicon (public, no auth required)
     */
    public function getSmallLogo(): JsonResponse
    {
        $settings = AdminSettings::first();

        $smallLogoUrl = $settings && $settings->small_logo ? Storage::url($settings->small_logo) : null;
        
        return $this->success([
            'small_logo' => $smallLogoUrl,
        ]);
    }

    /**
     * Serve favicon.ico from small logo (public, no auth required)
     */
    public function getFavicon()
    {
        $settings = AdminSettings::first();

        if ($settings && $settings->small_logo) {
            $logoPath = Storage::disk('public')->path($settings->small_logo);
            
            if (file_exists($logoPath)) {
                $mimeType = mime_content_type($logoPath);
                if (!$mimeType) {
                    $mimeType = 'image/png'; // Default to PNG
                }
                
                return response()->file($logoPath, [
                    'Content-Type' => $mimeType,
                    'Cache-Control' => 'public, max-age=31536000', // Cache for 1 year
                ]);
            }
        }

        // Fallback to default favicon if no small logo is set
        $defaultFavicon = public_path('favicon.ico');
        if (file_exists($defaultFavicon)) {
            return response()->file($defaultFavicon, [
                'Content-Type' => 'image/x-icon',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        // Return 404 if no favicon is available
        abort(404);
    }
}

