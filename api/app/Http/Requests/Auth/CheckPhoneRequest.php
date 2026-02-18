<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class CheckPhoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Accept digits, spaces, plus, hyphen, parentheses; keep simple allowlist
            'phone' => ['required','string','max:32','regex:/^[0-9\s\-()+]+$/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $raw = (string) $this->input('phone');
            $this->merge([
                'phone' => trim($raw),
            ]);
        }
    }
}


