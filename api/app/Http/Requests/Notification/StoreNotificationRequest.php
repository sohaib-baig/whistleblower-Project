<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required','uuid','exists:users,id'],
            'type' => ['required','string','max:128'],
            'message' => ['required','string'],
            'status' => ['nullable','string','in:unread,read,archived'],
        ];
    }
}


