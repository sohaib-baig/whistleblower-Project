<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    public function rules(): array
    {
        /** @var Role $role */
        $role = $this->route('role');
        $roleId = is_object($role) ? $role->id : $role;
        return [
            'name' => ['sometimes','string','max:255','unique:roles,name,'.$roleId],
            'permissions' => ['array'],
            'permissions.*' => ['string','exists:permissions,name'],
        ];
    }
}


