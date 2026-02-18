<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\ValidTimezone;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes','nullable','string','max:255'],
            'phone' => ['sometimes','nullable','string','max:32'],
            'company' => ['sometimes','nullable','string','max:255'],
            'country' => ['sometimes','nullable','string','max:255'],
            'address' => ['sometimes','nullable','string','max:255'],
            'state' => ['sometimes','nullable','string','max:255'],
            'city' => ['sometimes','nullable','string','max:255'],
            'zip_code' => ['sometimes','nullable','string','max:32'],
            'about' => ['sometimes','nullable','string','max:5000'],
            'timezone' => ['sometimes','nullable', new ValidTimezone()],
            'user_language' => ['sometimes','nullable','string','max:10'],
        ];
    }
}


