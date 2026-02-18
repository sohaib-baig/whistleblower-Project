<?php

namespace App\Http\Requests\AdminSettings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStripeConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'stripe_client_id' => ['nullable', 'string', 'max:255'],
            'stripe_secret_key' => ['nullable', 'string', 'max:255'],
            'stripe_webhook_secret' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'stripe_client_id.string' => 'Stripe Client ID must be a string',
            'stripe_client_id.max' => 'Stripe Client ID must not exceed 255 characters',
            'stripe_secret_key.string' => 'Stripe Secret Key must be a string',
            'stripe_secret_key.max' => 'Stripe Secret Key must not exceed 255 characters',
            'stripe_webhook_secret.string' => 'Stripe Webhook Secret must be a string',
            'stripe_webhook_secret.max' => 'Stripe Webhook Secret must not exceed 255 characters',
        ];
    }
}













