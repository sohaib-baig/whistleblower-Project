<?php

namespace App\Http\Requests\AdviseChat;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdviseChatAudioRequest extends FormRequest
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
            'audio' => [
                'required',
                'file',
                'max:10240',
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


