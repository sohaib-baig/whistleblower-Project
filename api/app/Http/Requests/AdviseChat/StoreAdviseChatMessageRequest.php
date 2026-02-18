<?php

namespace App\Http\Requests\AdviseChat;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdviseChatMessageRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'case_id' => ['required', 'string', 'uuid', 'exists:cases,id'],
            'message' => ['required', 'string', 'max:10000'],
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
            'message.required' => 'Message is required.',
            'message.max' => 'Message must not exceed 10,000 characters.',
        ];
    }
}


