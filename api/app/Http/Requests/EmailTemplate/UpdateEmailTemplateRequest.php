<?php

namespace App\Http\Requests\EmailTemplate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.update') ?? false;
    }

    public function rules(): array
    {
        $templateId = $this->route('email_template')?->id;
        $name = $this->input('name');
        $language = $this->input('language');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],
            'subject' => ['sometimes', 'string', 'max:500'],
            'content' => ['sometimes', 'string'],
            'placeholder' => ['nullable', 'string'],
            'language' => ['sometimes', 'string', 'max:10'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $name = $this->input('name');
            $language = $this->input('language');
            $templateId = $this->route('email_template')?->id;

            // If both name and language are provided, check unique constraint
            if ($name && $language) {
                $existing = \App\Models\EmailTemplate::where('name', $name)
                    ->where('language', $language)
                    ->where('id', '!=', $templateId)
                    ->first();

                if ($existing) {
                    $validator->errors()->add('name', 'A template with this name and language already exists.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Template name must be a string',
            'name.unique' => 'This template name already exists',
            'subject.string' => 'Email subject must be a string',
            'content.string' => 'Email content must be a string',
            'language.string' => 'Language must be a string',
            'status.in' => 'Status must be either active or inactive',
        ];
    }
}

