<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;

class IndexActivityLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null; // Additional policy check in controller
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes','uuid'],
            'search' => ['sometimes','string','max:255'],
            'date_from' => ['sometimes','date'],
            'date_to' => ['sometimes','date','after_or_equal:date_from'],
            'per_page' => ['sometimes','integer','min:1','max:100'],
        ];
    }
}


