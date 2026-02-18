<?php

namespace App\Http\Requests\ThemeConfiguration;

use Illuminate\Foundation\Http\FormRequest;

class UpdateThemeConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any authenticated user can update their own theme configuration
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'mode' => ['nullable', 'boolean'],
            'contrast' => ['nullable', 'boolean'],
            'right_left' => ['nullable', 'boolean'],
            'compact' => ['nullable', 'boolean'],
            'color_setting' => ['nullable', 'string', 'max:50'],
            'navigation_type' => ['nullable', 'integer', 'in:1,2,3'],
            'navigation_color' => ['nullable', 'boolean'],
            'typography' => ['nullable', 'string', 'max:100'],
            'font_size' => ['nullable', 'string', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'mode.boolean' => 'Mode must be a boolean value',
            'navigation_type.integer' => 'Navigation type must be an integer',
            'navigation_type.in' => 'Navigation type must be 1 (vertical), 2 (horizontal), or 3 (mini)',
        ];
    }
}

