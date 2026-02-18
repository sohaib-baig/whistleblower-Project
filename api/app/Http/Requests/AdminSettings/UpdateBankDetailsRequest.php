<?php

namespace App\Http\Requests\AdminSettings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBankDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.update') ?? false;
    }

    public function rules(): array
    {
        return [
            // IBAN: country code + 2 digits + up to 30 alphanumerics/spaces
            'iban' => ['nullable', 'string', 'max:64', 'regex:/^[A-Z]{2}[0-9]{2}[A-Z0-9 ]{8,30}$/'],
            // BIC/SWIFT: 8 or 11 characters
            'bic_code' => ['nullable', 'string', 'max:11', 'regex:/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/'],
            // Bank account: allow letters, numbers, spaces and dashes
            'bank_account' => ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9 \-]{4,64}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'iban.string' => 'IBAN must be a string',
            'iban.max' => 'IBAN must not exceed 64 characters',
            'iban.regex' => 'Invalid IBAN format. Example: SE06 5000 0000 0519 0103 0261',
            'bic_code.string' => 'BIC/SWIFT must be a string',
            'bic_code.max' => 'BIC/SWIFT must not exceed 11 characters',
            'bic_code.regex' => 'Invalid BIC/SWIFT format',
            'bank_account.string' => 'Bank account must be a string',
            'bank_account.max' => 'Bank account must not exceed 64 characters',
            'bank_account.regex' => 'Bank account may include letters, numbers, spaces, and dashes (e.g., BG 658-4643)',
        ];
    }
}


