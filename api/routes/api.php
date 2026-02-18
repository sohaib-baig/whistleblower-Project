<?php

use Illuminate\Support\Facades\Route;

use Illuminate\Http\Request;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;

Route::prefix('v1')->group(function () {
    // Mobile token flow (Bearer tokens)
    Route::prefix('auth')->group(function () {
        Route::post('/mobile/login', function (Request $request) {
            $data = $request->validate([
                'email' => ['required','email'],
                'password' => ['required','string'],
            ]);
            $user = \App\Models\User::where('email', $data['email'])->first();
            if (! $user || ! \Illuminate\Support\Facades\Hash::check($data['password'], $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 422);
            }
            if ((int) ($user->is_active ?? 0) === 0) {
                return response()->json(['message' => 'Account is banned.'], 403);
            }
            $token = $user->createToken('mobile', ['mobile'])->plainTextToken;
            return response()->json(['token' => $token]);
        })->middleware(['throttle:login']);

        Route::post('/mobile/logout', function (Request $request) {
            $request->user()->currentAccessToken()?->delete();
            return response()->json(['message' => 'Token revoked']);
        })->middleware(['auth:sanctum','abilities:mobile']);
    });

    // Public health endpoint with standard envelope
    Route::get('/health', function () {
        return response()->json([
            'status' => true,
            'message' => 'OK',
            'data' => ['ok' => true],
        ]);
    });
});