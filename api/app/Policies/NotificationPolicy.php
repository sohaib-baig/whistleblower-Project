<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;

class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('notifications.view') || $user->hasRole('admin');
    }

    public function view(User $user, Notification $notification): bool
    {
        return $user->id === $notification->user_id || $user->can('notifications.view');
    }

    public function create(User $user): bool
    {
        return $user->can('notifications.create');
    }

    public function update(User $user, Notification $notification): bool
    {
        return $user->can('notifications.update');
    }

    public function delete(User $user, Notification $notification): bool
    {
        return $user->can('notifications.delete');
    }
}


