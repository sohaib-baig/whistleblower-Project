<?php

namespace App\Http\Requests\AdminSettings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBasicConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'logo' => ['nullable', 'string'], // base64 data URL or existing path
            'small_logo' => ['nullable', 'string'], // base64 data URL or existing path
            'open_state_deadline_days' => ['required', 'integer', 'min:0', 'max:3650'],
            'close_state_deadline_days' => ['required', 'integer', 'min:0', 'max:3650'],
            'vat' => ['required', 'numeric', 'min:0', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'phone_hours_from' => ['required', 'date_format:H:i'],
            'phone_hours_to' => ['required', 'date_format:H:i'],
            'invoice_note' => ['nullable', 'string'],
            'delete_closed_cases' => ['required', 'boolean'],
            'delete_closed_cases_period' => ['nullable', 'integer', 'min:1', 'required_if:delete_closed_cases,true'],
            'delete_closed_cases_period_type' => ['nullable', 'in:daily,weekly,monthly,yearly', 'required_if:delete_closed_cases,true'],
        ];
    }
}


