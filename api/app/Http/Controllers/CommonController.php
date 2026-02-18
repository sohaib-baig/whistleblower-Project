<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Controllers\Concerns\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CommonController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * Get media buyers for dropdown/filter usage
     * Accepts multiple permissions (comma-separated) - user needs ALL of them
     */
    public function getMediaBuyers(Request $request): JsonResponse
    {
        // Get required permissions from request (comma-separated)
        $permissionsParam = $request->string('permission')->toString();

        // Check if permission parameter is provided
        if (!$permissionsParam) {
            return $this->error('Permission parameter is required', 400);
        }

        // Split comma-separated permissions
        $requiredPermissions = array_map('trim', explode(',', $permissionsParam));

        // Check if user has ALL of the required permissions
        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required', 401);
        }

        $hasPermission = $user->hasRole('admin'); // Admin can access everything

        if (!$hasPermission) {
            // Check if user has ALL required permissions
            $hasAllPermissions = true;
            foreach ($requiredPermissions as $permission) {
                if (!$user->hasPermissionTo($permission)) {
                    $hasAllPermissions = false;
                    break;
                }
            }
            $hasPermission = $hasAllPermissions;
        }

        if (!$hasPermission) {
            return $this->error('Insufficient permissions - all required permissions must be granted', 403);
        }

        // Get pagination parameters (maintain compatibility with existing API)
        $perPage = max(1, min(100, (int) $request->integer('per_page', 100)));

        // Get media buyers (users with media_buyer role)
        $query = User::whereHas('roles', function($q) {
            $q->where('name', 'media_buyer');
        });

        $mediaBuyers = $query->paginate($perPage);

        // Transform to send only required parameters for dropdown/filter usage
        $transformedData = $mediaBuyers->getCollection()->map(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ];
        });

        return $this->success([
            'data' => $transformedData,
            'meta' => [
                'current_page' => $mediaBuyers->currentPage(),
                'per_page' => $mediaBuyers->perPage(),
                'total' => $mediaBuyers->total(),
            ],
            'links' => [
                'first' => $mediaBuyers->url(1),
                'last' => $mediaBuyers->url($mediaBuyers->lastPage()),
                'prev' => $mediaBuyers->previousPageUrl(),
                'next' => $mediaBuyers->nextPageUrl(),
            ],
        ], 'Media buyers retrieved successfully');
    }
}
