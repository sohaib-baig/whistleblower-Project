<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\VatValidation;
use App\Services\TurnstileService;
use Illuminate\Support\Facades\Log;

class SignupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        $country = $this->input('country');
        
        // EU countries that require VAT (except Sweden)
        $euVatCountries = [
            'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
            'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
            'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
            'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain'
        ];
        
        $isEUCountryExceptSweden = $country && in_array($country, $euVatCountries, true) && $country !== 'Sweden';
        
        // Check if Turnstile should be skipped (local environment)
        $turnstileService = app(TurnstileService::class);
        $skipTurnstile = $turnstileService->shouldSkipVerification();
        
        return [
            // Personal Details (Step 1)
            'firstName' => ['required', 'string', 'min:2', 'max:255'],
            'lastName' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'min:10', 'max:32', 'unique:users,phone'],
            
            // Company Details (Step 2)
            'companyName' => ['required', 'string', 'min:2', 'max:255', 'unique:users,company_name'],
            'companyNumber' => ['required', 'string', 'min:1', 'max:255'],
            'address' => ['required', 'string', 'min:5', 'max:500'],
            'city' => ['required', 'string', 'min:2', 'max:255'],
            'country' => ['required', 'string', 'min:1', 'max:255'],
            'vatNumber' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            
            // Payment Details (Step 3)
            'paymentMethod' => ['required', 'in:card,bank'],
            'paymentAttachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], // 5MB max, optional
            
            // User Preferences
            'user_language' => ['nullable', 'string', 'max:10', 'in:en,sv,no,da,fi,de,fr'],
            
            // Turnstile verification (required in production, optional in local)
            'turnstile_token' => $skipTurnstile ? ['nullable', 'string'] : ['required', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Normalize email
        if ($this->has('email')) {
            $this->merge([
                'email' => trim(strtolower((string) $this->input('email'))),
            ]);
        }

        // Normalize phone
        if ($this->has('phone')) {
            $this->merge([
                'phone' => trim((string) $this->input('phone')),
            ]);
        }

        // Normalize company name (trim whitespace)
        if ($this->has('companyName')) {
            $this->merge([
                'companyName' => trim((string) $this->input('companyName')),
            ]);
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $country = $this->input('country');
            $vatNumber = $this->input('vatNumber');
            
            // EU countries that require VAT (except Sweden)
            $euVatCountries = [
                'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
                'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
                'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
                'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain'
            ];
            
            $isEUCountryExceptSweden = $country && in_array($country, $euVatCountries, true) && $country !== 'Sweden';
            
            // Validate VAT format for EU countries (except Sweden) - only if VAT number is provided
            if ($isEUCountryExceptSweden && $vatNumber && trim((string) $vatNumber) !== '') {
                if (!VatValidation::validateFormat(trim((string) $vatNumber), $country)) {
                    $format = VatValidation::getFormatDescription($country);
                    $validator->errors()->add(
                        'vatNumber',
                        "Invalid VAT number format. Expected format: {$format}"
                    );
                }
            }
            
            // Verify Turnstile token (skip in local environment)
            $turnstileService = app(TurnstileService::class);
            if (!$turnstileService->shouldSkipVerification()) {
                $turnstileToken = $this->input('turnstile_token');
                if (!empty($turnstileToken)) {
                    $verification = $turnstileService->verify($turnstileToken, $this->ip());
                    
                    if (!$verification['success']) {
                        Log::warning('Turnstile verification failed for signup attempt', [
                            'email' => $this->input('email'),
                            'error' => $verification['error'],
                            'ip' => $this->ip(),
                        ]);
                        $validator->errors()->add(
                            'turnstile_token',
                            'Security verification failed. Please try again.'
                        );
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'firstName.required' => 'First name is required',
            'lastName.required' => 'Last name is required',
            'email.required' => 'Email is required',
            'email.unique' => 'Email already exists',
            'phone.required' => 'Phone number is required',
            'phone.unique' => 'Phone number already exists',
            'companyName.required' => 'Company name is required',
            'companyName.unique' => 'Company name already exists. Please choose a different company name.',
            'companyNumber.required' => 'Company number is required',
            'address.required' => 'Address is required',
            'city.required' => 'City is required',
            'country.required' => 'Country is required',
            'paymentMethod.required' => 'Payment method is required',
            'paymentAttachment.mimes' => 'Payment screenshot must be JPG, JPEG, PNG, or PDF',
            'paymentAttachment.max' => 'Payment screenshot must not exceed 5MB',
        ];
    }
}

