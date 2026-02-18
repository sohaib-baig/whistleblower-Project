<?php

namespace App\Policies;

use App\Models\ManualEntry;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ManualEntryPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return ($user->hasPermissionTo('manual_entries.view') || $user->hasPermissionTo('manual_entries.manage')) || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ManualEntry $manualEntry): bool
    {
        // Admin can view all
        if ($user->hasRole('admin')) {
            return true;
        }

        // User with manage permission can view all entries
        if ($user->hasPermissionTo('manual_entries.manage')) {
            return true;
        }

        // User with view permission can only view their own entries
        if ($user->hasPermissionTo('manual_entries.view')) {
            return $manualEntry->media_buyer_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return ($user->hasPermissionTo('manual_entries.create') || $user->hasPermissionTo('manual_entries.manage')) || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ManualEntry $manualEntry): bool
    {
        // Admin can update all
        if ($user->hasRole('admin')) {
            return true;
        }

        // User with manage and update permission can update entries
        if ($user->hasPermissionTo('manual_entries.manage') && $user->hasPermissionTo('manual_entries.update')) {
            return true;
        }

        // User with update permission can only update their own entries
        if ($user->hasPermissionTo('manual_entries.update')) {
            return $manualEntry->media_buyer_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ManualEntry $manualEntry): bool
    {
        // Admin can delete all
        if ($user->hasRole('admin')) {
            return true;
        }

        // User with manage or delete permission can delete entries
        if ($user->hasPermissionTo('manual_entries.manage') && $user->hasPermissionTo('manual_entries.delete')) {
            return true;
        }

        // User with delete permission can only delete their own entries
        if ($user->hasPermissionTo('manual_entries.delete')) {
            return $manualEntry->media_buyer_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ManualEntry $manualEntry): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ManualEntry $manualEntry): bool
    {
        return false;
    }
}
