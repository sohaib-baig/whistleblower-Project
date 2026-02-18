<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function view(User $user, User $target): bool
    {
        return $user->can('users.view') || $user->id === $target->id || $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    public function update(User $user, User $target): bool
    {
        return $user->hasRole('admin') || $user->id === $target->id;
    }

    public function delete(User $user, User $target): bool
    {
        return $user->can('users.delete');
    }
}


