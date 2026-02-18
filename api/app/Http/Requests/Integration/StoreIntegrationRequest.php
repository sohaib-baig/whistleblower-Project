<?php

namespace App\Http\Requests\Integration;

use Illuminate\Foundation\Http\FormRequest;

class StoreIntegrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:integrations,name'],
            'endpoint' => ['required', 'string', 'url', 'max:500'],
            'app_key' => ['required', 'string', 'max:255'],
            'app_secret' => ['required', 'string', 'max:1000'],
            'is_connected' => ['boolean'],
        ];
    }
}
