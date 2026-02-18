<?php

namespace App\Http\Requests\CaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint, authorization can be added if needed
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Note title is required.',
            'title.max' => 'Note title must not exceed 255 characters.',
            'description.required' => 'Note description is required.',
            'description.max' => 'Note description must not exceed 10,000 characters.',
        ];
    }
}
