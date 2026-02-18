<?php

namespace App\Http\Requests\CaseManager;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCaseManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        // Only company users can create case managers (admins cannot)
        return $user->hasRole('company');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'min:10', 'max:30', 'unique:users,phone'],
            'country' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'state' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:30'],
            'avatar' => ['sometimes', 'file', 'mimes:jpg,jpeg,png', 'max:3072'],
            // Accept booleans or explicit status codes: 0=banned, 1=active, 2=pending
            'is_active' => ['nullable', 'in:0,1,2,true,false'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Case manager name is required',
            'email.required' => 'Email is required',
            'email.unique' => 'This email is already registered',
            'phone.min' => 'Phone number must be at least 10 digits',
            'phone.max' => 'Phone number must not exceed 30 characters',
            'phone.unique' => 'Phone number is already registered',
            'avatar.mimes' => 'Avatar must be a valid image (jpg, jpeg, png)',
            'avatar.max' => 'Avatar size must not exceed 3MB',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => trim(strtolower((string) $this->input('email'))),
            ]);
        }

        if ($this->has('phone')) {
            $this->merge([
                'phone' => trim((string) $this->input('phone')),
            ]);
        }
    }
}
