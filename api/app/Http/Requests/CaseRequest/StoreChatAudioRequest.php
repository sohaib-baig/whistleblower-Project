<?php

namespace App\Http\Requests\CaseRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatAudioRequest extends FormRequest
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
            'audio' => [
                'required',
                'file',
                'max:10240', // 10MB max file size
                // Use mimes validation (extension-based) which is more reliable for MediaRecorder files
                // MediaRecorder can produce files with varying MIME types, so we validate by extension
                'mimes:webm,ogg,wav,mp3,mpeg,opus',
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
            'audio.required' => 'Audio file is required.',
            'audio.file' => 'The uploaded file is invalid.',
            'audio.max' => 'Audio file size must not exceed 10MB.',
        ];
    }
}

