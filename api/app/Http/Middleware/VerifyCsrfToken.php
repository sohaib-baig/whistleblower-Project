<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/v1/public/cases',
        'api/v1/stripe/webhook',
    ];

    /**
     * Determine if the request has a URI that should pass through CSRF verification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function inExceptArray($request)
    {
        // Get various path representations
        $path = $request->path();
        $uri = $request->getRequestUri();
        $routeUri = $request->route() ? $request->route()->uri() : null;
        
        // Log for debugging (remove in production)
        if (str_contains($uri, 'public/cases') || str_contains($path, 'public')) {
            \Log::info('CSRF Check', [
                'path' => $path,
                'uri' => $uri,
                'route_uri' => $routeUri,
                'method' => $request->method(),
            ]);
        }
        
        // Check if it's the public cases endpoint
        if ($request->is('api/v1/public/cases') || 
            $request->is('*/api/v1/public/cases') ||
            str_contains($path, 'api/v1/public/') ||
            str_contains($uri, 'api/v1/public/') ||
            ($routeUri && str_contains($routeUri, 'public/cases'))) {
            return true;
        }
        
        // Check if it's the Stripe webhook endpoint
        if ($request->is('api/v1/stripe/webhook') || 
            $request->is('*/api/v1/stripe/webhook') ||
            str_contains($path, 'stripe/webhook') ||
            str_contains($uri, 'stripe/webhook') ||
            ($routeUri && str_contains($routeUri, 'stripe/webhook'))) {
            return true;
        }
        
        return parent::inExceptArray($request);
    }
}
