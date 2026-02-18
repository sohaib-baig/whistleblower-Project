<?php

namespace App\Http\Requests\Severity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSeverityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        $user->loadMissing('roles');
        $roleColumn = $user->role ?? null;

        return $user->hasAnyRole(['admin', 'company'])
            || ($roleColumn && in_array($roleColumn, ['admin', 'company'], true))
            || $user->can('severities.create')
            || $user->can('severities.manage');
    }

    public function rules(): array
    {
        $user = $this->user();
        $companyId = null;

        if ($user) {
            $user->loadMissing('roles');
            if ($user->hasRole('company') || ($user->role ?? null) === 'company') {
                $companyId = $user->id;
            }
        }

        if ($companyId === null) {
            $companyId = $this->input('company_id');
        }

        $uniqueRule = Rule::unique('severities', 'name');

        if ($companyId) {
            $uniqueRule = $uniqueRule->where('company_id', $companyId);
        } else {
            $uniqueRule = $uniqueRule->whereNull('company_id');
        }

        $rules = [
            'name' => ['required', 'string', 'max:255', $uniqueRule],
            'status' => ['nullable', 'in:active,inactive'],
        ];

        if ($user && !($user->hasRole('company') || ($user->role ?? null) === 'company')) {
            $rules['company_id'] = ['nullable', 'uuid', 'exists:users,id'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Severity name is required',
            'name.unique' => 'This severity name already exists',
            'status.in' => 'Status must be either active or inactive',
        ];
    }
}

