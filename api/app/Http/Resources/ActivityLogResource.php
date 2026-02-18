<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\DateTimeService;

class ActivityLogResource extends JsonResource
{
    public function toArray($request): array
    {
        $dt = app(DateTimeService::class);
        $user = $request->user();
        $userTz = $user?->timezone ?: 'UTC';

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', function () use ($dt, $userTz) {
                return [
                    'id' => $this->user?->id,
                    'name' => $this->user?->name,
                    'email' => $this->user?->email,
                    'avatar_url' => $this->user?->avatar_path ? \Storage::disk('public')->url($this->user->avatar_path) : null,
                ];
            }),
            'action' => $this->action,
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'context' => $this->context,
            'created_at' => $dt->toUserTzFormat($this->created_at, $userTz, 'd-M-Y h:i:s a'),
        ];
    }
}


