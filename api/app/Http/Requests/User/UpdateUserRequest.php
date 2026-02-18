<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        
        if (!$user) {
            return false;
        }
        
        // Allow admins with users.update permission
        if ($user->can('users.update')) {
            return true;
        }
        
        // Allow company users (including impersonated company users) to update their own profile
        $targetUser = $this->route('user');
        if ($targetUser && $user->hasRole('company') && $user->id === $targetUser->id) {
            return true;
        }
        
        // Handle impersonation: if admin is impersonating, check admin's permissions
        if ($this->session()->has('impersonator_id')) {
            $impersonatorId = $this->session()->get('impersonator_id');
            $admin = \App\Models\User::find($impersonatorId);
            if ($admin && $admin->can('users.update')) {
                return true;
            }
        }
        
        return false;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? 'NULL';
        return [
            'name' => ['nullable','string','max:255'],
            'email' => [
                'nullable','email','max:255',
                'unique:users,email,'.($userId),
            ],
            'password' => ['nullable','string','min:8'],
            'phone' => ['nullable','string','max:30'],
            'phone_hours_from' => ['nullable','date_format:H:i'],
            'phone_hours_to' => ['nullable','date_format:H:i'],
            'phone_hours_format' => ['nullable','in:12h,24h'],
            'country' => ['nullable','string','max:255'],
            'timezone' => [
                'nullable','string','max:255',
                Rule::in(\DateTimeZone::listIdentifiers()),
            ],
            'address' => ['nullable','string','max:255'],
            'physical_address' => ['nullable','string'],
            'state' => ['nullable','string','max:255'],
            'city' => ['nullable','string','max:255'],
            'zip_code' => ['nullable','string','max:30'],
            'about' => ['nullable','string'],
            'company' => ['nullable','string','max:255'],
            'company_number' => ['nullable','string','max:255'],
			// Traffic source required when role is media_buyer
			'traffic_source' => ['nullable','string','max:255','required_if:role,media_buyer'],
            'user_language' => ['nullable','string','max:10'],
            // Accept booleans or explicit status codes: 1=active, 2=pending, 3=banned
            'is_active' => ['nullable','in:0,1,2,3,true,false'],
            'is_verified' => ['boolean'],
            'role' => ['nullable','string','exists:roles,name'],
			'avatar' => ['sometimes','file','mimes:jpg,jpeg,png','max:3072'],
        ];
    }
}


