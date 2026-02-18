<?php

namespace App\Http\Requests\Question;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // If impersonating, check the original admin's permissions
        if ($this->session()->has('impersonator_id')) {
            $impersonatorId = $this->session()->get('impersonator_id');
            $admin = \App\Models\User::find($impersonatorId);
            return $admin?->can('questions.update') ?? false;
        }

        $user = $this->user();
        if (!$user) {
            return false;
        }

        $question = $this->route('question');

        // Allow company role to manage only their own questions
        if ($user->hasRole('company') && $question && $question->user_id === $user->id) {
            return true;
        }

        return $user->can('questions.update');
    }

    public function rules(): array
    {
        $validInputTypes = [
            'text', 'select', 'password', 'email', 'url', 'tel', 'search',
            'number', 'range', 'date', 'datetime-local', 'month', 'week',
            'time', 'checkbox', 'radio', 'file', 'color'
        ];

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'is_required' => ['sometimes', 'boolean'],
            'input_type' => ['sometimes', 'string', Rule::in($validInputTypes)],
            'options' => ['nullable', 'array'],
            'options.*' => ['required', 'string', 'max:255'],
            'order' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Question name must be a string',
            'is_required.boolean' => 'Required field must be true or false',
            'input_type.in' => 'Invalid input type selected',
            'options.array' => 'Options must be an array',
            'options.*.required' => 'Each option is required',
            'options.*.string' => 'Each option must be a string',
            'order.integer' => 'Order must be a number',
            'order.min' => 'Order must be at least 1',
        ];
    }
}
