<?php

namespace App\Http\Requests\Question;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // If impersonating, check the original admin's permissions
        if ($this->session()->has('impersonator_id')) {
            $impersonatorId = $this->session()->get('impersonator_id');
            $admin = \App\Models\User::find($impersonatorId);
            return $admin?->can('questions.create') ?? false;
        }

        $user = $this->user();
        if (!$user) {
            return false;
        }

        // Allow company role to manage their own questions even without explicit permission
        if ($user->hasRole('company')) {
            return true;
        }

        return $user->can('questions.create');
    }

    public function rules(): array
    {
        $validInputTypes = [
            'text', 'select', 'password', 'email', 'url', 'tel', 'search',
            'number', 'range', 'date', 'datetime-local', 'month', 'week',
            'time', 'checkbox', 'radio', 'file', 'color'
        ];

        return [
            'name' => ['required', 'string'],
            'is_required' => ['required', 'boolean'],
            'input_type' => ['required', 'string', Rule::in($validInputTypes)],
            'options' => ['nullable', 'array'],
            'options.*' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Question name is required',
            'is_required.required' => 'Please specify if this question is required',
            'is_required.boolean' => 'Required field must be true or false',
            'input_type.required' => 'Input type is required',
            'input_type.in' => 'Invalid input type selected',
            'options.array' => 'Options must be an array',
            'options.*.required' => 'Each option is required',
            'options.*.string' => 'Each option must be a string',
        ];
    }
}
