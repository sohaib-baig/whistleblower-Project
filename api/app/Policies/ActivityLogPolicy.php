<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ActivityLog;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->can('activitylogs.viewAny');
    }

    public function viewOwn(User $user): bool
    {
        return $user !== null;
    }
}


