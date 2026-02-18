<?php

namespace App\Http\Requests\EmailTemplate;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'placeholder' => ['nullable', 'string'],
            'language' => ['required', 'string', 'max:10'],
            'status' => ['required', 'in:active,inactive'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $name = $this->input('name');
            $language = $this->input('language');

            if ($name && $language) {
                $existing = \App\Models\EmailTemplate::where('name', $name)
                    ->where('language', $language)
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
            'name.required' => 'Template name is required',
            'name.unique' => 'This template name already exists',
            'subject.required' => 'Email subject is required',
            'content.required' => 'Email content is required',
            'language.required' => 'Language is required',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be either active or inactive',
        ];
    }
}

