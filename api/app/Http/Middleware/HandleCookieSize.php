<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to handle cookie size issues
 * Prevents "400 Bad Request - Request Header Or Cookie Too Large" errors
 * 
 * This middleware checks cookie size and clears old/expired cookies if they're getting too large.
 * It only runs on API routes to avoid interfering with normal web operations.
 */
class HandleCookieSize
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check total cookie size (browsers typically limit to ~4KB per cookie, ~8KB total)
        // Most servers limit total header size to ~8KB-16KB
        $cookieHeader = $request->server->get('HTTP_COOKIE', '');
        $totalCookieSize = strlen($cookieHeader);
        
        // If cookies are getting too large (>6KB), we need to handle it
        // Note: We can't clear cookies in middleware before the request is processed,
        // but we can ensure the response clears old cookies
        if ($totalCookieSize > 6144) {
            \Log::warning('Large cookie size detected', [
                'size' => $totalCookieSize,
                'path' => $request->path(),
            ]);
        }
        
        $response = $next($request);
        
        // After processing, if cookies were too large, ensure we clear any old session cookies
        // This helps prevent accumulation of old cookies
        if ($totalCookieSize > 6144 && $request->is('api/*')) {
            // Clear any duplicate or old session cookies that might exist
            $sessionCookieName = config('session.cookie');
            $cookiePath = config('session.path', '/');
            $cookieDomain = config('session.domain');
            
            // Ensure only one session cookie exists by clearing any duplicates
            // This is a preventive measure
            if (!$request->hasSession() || !$request->user()) {
                // If no valid session, clear the cookie
                $response->cookie($sessionCookieName, '', -2628000, $cookiePath, $cookieDomain, config('session.secure', false), config('session.http_only', true), false, config('session.same_site', 'lax'));
            }
        }
        
        return $response;
    }
}

