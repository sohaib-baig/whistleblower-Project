<?php

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;
use Spatie\Permission\Models\Permission;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('admin') ?? false;
    }

    public function rules(): array
    {
        /** @var Permission $permission */
        $permission = $this->route('permission');
        $permId = is_object($permission) ? $permission->id : $permission;
        return [
            'name' => ['required','string','max:255','unique:permissions,name,'.$permId],
        ];
    }
}


