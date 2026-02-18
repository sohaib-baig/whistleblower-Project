<?php

namespace App\Http\Requests\Department;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
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
            || $user->can('departments.update')
            || $user->can('departments.manage');
    }

    public function rules(): array
    {
        $departmentId = $this->route('department')?->id;
        $department = $this->route('department');
        $user = $this->user();
        $companyId = $department?->company_id;

        if ($user) {
            $user->loadMissing('roles');
            if ($user->hasRole('company') || ($user->role ?? null) === 'company') {
                $companyId = $user->id;
            }
        }

        if ($companyId === null) {
            $companyId = $this->input('company_id', null);
        }

        $uniqueRule = Rule::unique('departments', 'name')->ignore($departmentId);

        if ($companyId) {
            $uniqueRule = $uniqueRule->where('company_id', $companyId);
        } else {
            $uniqueRule = $uniqueRule->whereNull('company_id');
        }

        $rules = [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                $uniqueRule
            ],
            'status' => ['nullable', 'in:active,inactive'],
        ];

        if ($user && ($user->hasRole('company') || ($user->role ?? null) === 'company')) {
            $rules['company_id'] = ['prohibited'];
        } else {
            $rules['company_id'] = ['nullable', 'uuid', 'exists:users,id'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Department name must be a string',
            'name.unique' => 'This department name already exists',
            'status.in' => 'Status must be either active or inactive',
        ];
    }
}

