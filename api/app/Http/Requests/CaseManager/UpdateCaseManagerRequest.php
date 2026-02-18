<?php

namespace App\Http\Requests\CaseManager;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCaseManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $caseManager = $this->route('case_manager');
        
        // If impersonating, check the original admin's permissions
        if ($this->session()->has('impersonator_id')) {
            $impersonatorId = $this->session()->get('impersonator_id');
            $admin = \App\Models\User::find($impersonatorId);
            return $admin?->can('users.update') ?? false;
        }

        if (!$user) {
            return false;
        }

        if ($user->hasRole('company')) {
            return $caseManager?->company_id === $user->id;
        }
        
        // Allow if user has update permission OR is updating their own profile
        return ($user->can('users.update') ?? false) || ($user->id === $caseManager?->id);
    }

    public function rules(): array
    {
        $caseManagerId = $this->route('case_manager')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($caseManagerId)
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'min:10',
                'max:30',
                Rule::unique('users', 'phone')->ignore($caseManagerId)
            ],
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
            'name.string' => 'Case manager name must be a string',
            'email.email' => 'Please provide a valid email address',
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
