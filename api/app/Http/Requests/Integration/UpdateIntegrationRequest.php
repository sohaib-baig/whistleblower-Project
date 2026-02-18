<?php

namespace App\Http\Requests\Integration;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIntegrationRequest extends FormRequest
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
        $integrationId = $this->route('integration')->id;

        return [
            // Integration name is immutable - cannot be updated
            // 'name' => ['sometimes', 'string', 'max:255', 'unique:integrations,name,' . $integrationId],
            'endpoint' => ['sometimes', 'string', 'url', 'max:500'],
            'app_key' => ['sometimes', 'string', 'max:255'],
            'app_secret' => ['sometimes', 'string', 'max:1000'],
            'is_connected' => ['sometimes', 'boolean'],
        ];
    }
}
