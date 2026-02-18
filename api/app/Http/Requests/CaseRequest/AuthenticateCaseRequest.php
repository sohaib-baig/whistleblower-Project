<?php

namespace App\Http\Requests\CaseRequest;

use App\Models\User;
use App\Services\TurnstileService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthenticateCaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Prepare the data for validation.
     * Converts company slug to UUID if needed.
     */
    protected function prepareForValidation(): void
    {
        // Convert company slug to UUID if provided as slug
        if ($this->has('company_id')) {
            $companyIdentifier = $this->input('company_id');
            
            // Check if it's a valid UUID
            if (!Str::isUuid($companyIdentifier)) {
                // Not a UUID, try to find by slug
                $company = User::where('company_slug', $companyIdentifier)
                    ->orWhere('id', $companyIdentifier)
                    ->first();
                
                if ($company) {
                    $this->merge(['company_id' => $company->id]);
                }
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        // Check if Turnstile should be skipped (local environment)
        $turnstileService = app(TurnstileService::class);
        $skipTurnstile = $turnstileService->shouldSkipVerification();
        
        return [
            'company_id' => ['required', 'string', 'uuid', 'exists:users,id'],
            'password' => ['required', 'string', 'min:1'],
            'turnstile_token' => $skipTurnstile ? ['nullable', 'string'] : ['required', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Verify Turnstile token (skip in local environment)
            $turnstileService = app(TurnstileService::class);
            if (!$turnstileService->shouldSkipVerification()) {
                $turnstileToken = $this->input('turnstile_token');
                if (!empty($turnstileToken)) {
                    $verification = $turnstileService->verify($turnstileToken, $this->ip());
                    
                    if (!$verification['success']) {
                        Log::warning('Turnstile verification failed for company login attempt', [
                            'company_id' => $this->input('company_id'),
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

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'company_id.required' => 'Company ID is required.',
            'company_id.uuid' => 'Company ID must be a valid UUID.',
            'company_id.exists' => 'Company not found.',
            'password.required' => 'Password is required.',
        ];
    }
}











