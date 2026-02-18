<?php

namespace App\Http\Requests\CaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreCaseLogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'case_id' => ['required', 'string', 'uuid', 'exists:cases,id'],
            'action_type' => ['required', 'string', 'max:255'],
            'action_value' => ['nullable', 'string', 'max:10000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'case_id.required' => 'Case ID is required.',
            'case_id.uuid' => 'Case ID must be a valid UUID.',
            'case_id.exists' => 'Case not found.',
            'action_type.required' => 'Action type is required.',
            'action_type.max' => 'Action type must not exceed 255 characters.',
            'action_value.max' => 'Action value must not exceed 10,000 characters.',
        ];
    }
}

