<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'company_name' => ['nullable', 'string', 'max:255'],
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
            'name.required' => 'Company contact name is required',
            'email.required' => 'Company email is required',
            'email.unique' => 'This email is already registered',
            'phone.max' => 'Phone number must not exceed 30 characters',
            'avatar.mimes' => 'Avatar must be a valid image (jpg, jpeg, png)',
            'avatar.max' => 'Avatar size must not exceed 3MB',
        ];
    }
}

