<?php

namespace App\Providers;

use App\Jobs\DeleteClosedCasesJob;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }

        // Schedule the delete closed cases job to run daily at 2 AM
        Schedule::job(new DeleteClosedCasesJob)->dailyAt('02:00');
    }
}
