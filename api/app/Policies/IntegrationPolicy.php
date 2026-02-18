<?php

namespace App\Policies;

use App\Models\Integration;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IntegrationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('integrations.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Integration $integration): bool
    {
        return $user->hasPermissionTo('integrations.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('integrations.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Integration $integration): bool
    {
        return $user->hasPermissionTo('integrations.update');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Integration $integration): bool
    {
        return $user->hasPermissionTo('integrations.delete');
    }
}
