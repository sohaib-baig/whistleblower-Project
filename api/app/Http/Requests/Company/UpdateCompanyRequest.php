<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $company = $this->route('company');
        
        // Allow if user has update permission OR is updating their own profile
        return ($user?->can('users.update') ?? false) || ($user?->id === $company?->id);
    }

    public function rules(): array
    {
        $companyId = $this->route('company')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($companyId)
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'company_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'country' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'state' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:30'],
            'avatar' => ['sometimes', 'file', 'mimes:jpg,jpeg,png', 'max:3072'],
            // Accept booleans or explicit status codes: 1=active, 2=pending, 3=banned
            'is_active' => ['nullable', 'in:0,1,2,3,true,false'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Company contact name must be a string',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email is already registered',
            'phone.max' => 'Phone number must not exceed 30 characters',
            'avatar.mimes' => 'Avatar must be a valid image (jpg, jpeg, png)',
            'avatar.max' => 'Avatar size must not exceed 3MB',
        ];
    }
}

