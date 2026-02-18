<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
//

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withProviders([
        App\Providers\RouteServiceProvider::class,
        App\Providers\AuthServiceProvider::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        // Ensure CORS headers are present for all routes including preflight (must run first)
        $middleware->prepend(Illuminate\Http\Middleware\HandleCors::class);

        // Web middleware group
        $middleware->web(append: [
            Illuminate\Cookie\Middleware\EncryptCookies::class,
            Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            Illuminate\Session\Middleware\StartSession::class,
            // Sanctum SPA session authentication
            Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
            Illuminate\View\Middleware\ShareErrorsFromSession::class,
            App\Http\Middleware\VerifyCsrfToken::class,
            Spatie\Csp\AddCspHeaders::class,
        ]);

        // API middleware group
        $middleware->api(prepend: [
        ], append: [
            // Default API rate limiter
            Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            Illuminate\Routing\Middleware\SubstituteBindings::class,
            App\Http\Middleware\RejectBannedUsers::class,
            App\Http\Middleware\HandleCookieSize::class,
            // Spatie\Csp\AddCspHeaders::class,
        ]);

        // Middleware aliases
        $middleware->alias([
            'abilities' => Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'ability' => Laravel\Sanctum\Http\Middleware\CheckForAnyAbility::class,
            // Spatie permission middlewares live under the singular \Middleware namespace
            'role' => Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => Spatie\Permission\Middleware\PermissionMiddleware::class,
            'reject.banned' => App\Http\Middleware\RejectBannedUsers::class,
            'require.password' => App\Http\Middleware\RequirePassword::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Illuminate\Http\Request $request) {
            $wantsJson = $request->expectsJson() || $request->is('api/*');
            if (! $wantsJson) {
                return null;
            }

            $status = 500;
            $message = 'Server Error';
            $data = null;

            if ($e instanceof Illuminate\Validation\ValidationException) {
                $status = 422;
                $message = 'The given data was invalid.';
                $data = ['errors' => $e->errors()];
            } elseif ($e instanceof Illuminate\Auth\AuthenticationException) {
                $status = 401;
                $message = 'Unauthenticated';
            } elseif ($e instanceof Illuminate\Auth\Access\AuthorizationException) {
                $status = 403;
                $message = $e->getMessage() ?: 'Forbidden';
            } elseif ($e instanceof Illuminate\Database\Eloquent\ModelNotFoundException) {
                $status = 404;
                $model = class_basename($e->getModel());
                $message = $model.' not found';
            } elseif ($e instanceof Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                $status = 404;
                $message = 'Not Found';
            } elseif ($e instanceof Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                $status = 405;
                $message = 'Method Not Allowed';
            } elseif ($e instanceof Illuminate\Http\Exceptions\ThrottleRequestsException) {
                $status = 429;
                $message = 'Too Many Requests';
            } elseif ($e instanceof Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $message = $e->getMessage() ?: Symfony\Component\HttpFoundation\Response::$statusTexts[$status] ?? 'Http Error';
            } else {
                $message = config('app.debug') ? $e->getMessage() : 'Server Error';
                if (config('app.debug')) {
                    $data = [
                        'exception' => get_class($e),
                        'trace' => collect($e->getTrace())->take(3),
                    ];
                }
            }

            return response()->json([
                'status' => false,
                'message' => $message,
                'data' => $data,
            ], $status);
        });
    })->create();
