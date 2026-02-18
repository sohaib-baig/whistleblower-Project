<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return [
                Limit::perMinute(300)->by(optional($request->user())->id ?: $request->ip()),
                Limit::perMinute(100)->by($request->ip()),
            ];
        });

        // More strict throttling for login endpoints
        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(10)->by($request->ip()),
                Limit::perMinute(10)->by((string) $request->input('email')),
            ];
        });
    }
}


