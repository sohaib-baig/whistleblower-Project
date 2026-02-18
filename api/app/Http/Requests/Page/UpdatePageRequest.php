<?php

namespace App\Http\Requests\Page;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
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
        
        // Allow company users (including impersonated company users)
        if ($user->hasRole('company')) {
            return true;
        }
        
        return false;
    }

    public function rules(): array
    {
        return [
            'page_title' => ['nullable', 'string', 'max:255'],
            'page_content' => ['required', 'string', 'min:20'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
            'language' => ['nullable', 'string', Rule::in(['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'])],
        ];
    }

    public function messages(): array
    {
        return [
            'page_title.max' => 'Page title must not exceed 255 characters',
            'page_content.required' => 'Page content is required',
            'page_content.min' => 'Page content must be at least 20 characters',
        ];
    }
}

