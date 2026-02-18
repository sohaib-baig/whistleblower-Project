<?php

namespace App\Policies;

use App\Models\User;
use App\Models\AdminSettings;

class AdminSettingsPolicy
{
    /**
     * Determine if the user can view any admin settings.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('users.update');
    }

    /**
     * Determine if the user can view the admin settings.
     */
    public function view(User $user, AdminSettings $adminSettings): bool
    {
        return $user->can('users.update');
    }

    /**
     * Determine if the user can create admin settings.
     */
    public function create(User $user): bool
    {
        return $user->can('users.update');
    }

    /**
     * Determine if the user can update the admin settings.
     */
    public function update(User $user, AdminSettings $adminSettings): bool
    {
        return $user->can('users.update');
    }

    /**
     * Determine if the user can delete the admin settings.
     */
    public function delete(User $user, AdminSettings $adminSettings): bool
    {
        return $user->can('users.update');
    }
}
