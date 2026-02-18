<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $user = $this->user();
        $hasInitialPassword = $user && !empty($user->initial_password);
        
        $rules = [
            'new_password' => [
                'required',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ];
        
        // If user has initial_password set, old_password is optional (they're already authenticated)
        // If provided, it will be validated against initial_password in the controller
        // For users with regular password, old_password is required and must match current password
        if ($hasInitialPassword) {
            $rules['old_password'] = ['sometimes', 'string'];
        } else {
            $rules['old_password'] = ['required', 'string', 'current_password'];
        }
        
        return $rules;
    }
}


