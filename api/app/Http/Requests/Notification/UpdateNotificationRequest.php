<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes','required','string','max:128'],
            'message' => ['sometimes','required','string'],
            'status' => ['sometimes','required','string','in:unread,read,archived'],
        ];
    }
}


