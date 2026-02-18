<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use App\Models\Notification;
use App\Models\ActivityLog;
use App\Policies\NotificationPolicy;
use App\Policies\ActivityLogPolicy;
use App\Models\Integration;
use App\Policies\IntegrationPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        Notification::class => NotificationPolicy::class,
        ActivityLog::class => ActivityLogPolicy::class,
        Integration::class => IntegrationPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
        Gate::before(function ($user, $ability) {
            return $user->hasRole('admin') ? true : null;
        });
    }
}


