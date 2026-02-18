<?php

namespace App\Http\Requests\AdviseChat;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreAdviseChatImageRequest extends FormRequest
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
            'image' => [
                'required',
                'file',
                'max:10240',
                File::types(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
            ],
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
            'image.required' => 'Image file is required.',
            'image.file' => 'The uploaded file is invalid.',
            'image.max' => 'Image file size must not exceed 10MB.',
        ];
    }
}


