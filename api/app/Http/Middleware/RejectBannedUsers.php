<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RejectBannedUsers
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && (int) ($user->is_active ?? 0) === 0) {
            $isApi = $request->expectsJson() || $request->is('api/*') || $request->is('api/v1/*');
            // For API/SPA routes, block ALL methods; for non-API, block write methods
            if ($isApi || in_array($request->method(), ['POST','PUT','PATCH','DELETE'])) {
                return response()->json([
                    'status' => false,
                    'message' => 'Account is banned.',
                    'data' => null,
                ], 403);
            }
        }
        return $next($request);
    }
}


