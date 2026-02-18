<?php

namespace App\Http\Requests\SupportTicketRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupportTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'status' => ['sometimes', 'in:open,closed'],
            'support_type' => ['required', 'in:legal_support,technical_support'],
            'case_id' => [
                'nullable',
                'uuid',
                'exists:cases,id',
                function ($attribute, $value, $fail) {
                    $supportType = $this->input('support_type');
                    if ($supportType === 'legal_support' && empty($value)) {
                        $fail('Case ID is required when support type is Legal Support.');
                    }
                },
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Title is required.',
            'title.max' => 'Title must not exceed 255 characters.',
            'content.required' => 'Content is required.',
            'status.in' => 'Invalid status selected.',
            'support_type.required' => 'Support type is required.',
            'support_type.in' => 'Support type must be either legal_support or technical_support.',
            'case_id.uuid' => 'Case ID must be a valid UUID.',
            'case_id.exists' => 'The selected case does not exist.',
        ];
    }
}