<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'phone' => ['nullable','string','max:30'],
            'country' => ['nullable','string','max:255'],
            'timezone' => [
                'nullable','string','max:255',
                Rule::in(\DateTimeZone::listIdentifiers()),
            ],
            'address' => ['nullable','string','max:255'],
            'state' => ['nullable','string','max:255'],
            'city' => ['nullable','string','max:255'],
            'zip_code' => ['nullable','string','max:30'],
            'about' => ['nullable','string'],
			'avatar' => ['sometimes','file','mimes:jpg,jpeg,png','max:3072'],
            'company' => ['nullable','string','max:255'],
			// Traffic source required when role is media_buyer
			'traffic_source' => ['nullable','string','max:255','required_if:role,media_buyer'],
            // Accept booleans or explicit status codes: 1=active, 2=pending, 3=banned
            'is_active' => ['nullable','in:0,1,2,3,true,false'],
            'is_verified' => ['boolean'],
            'role' => ['nullable','string','exists:roles,name'],
        ];
    }
}


