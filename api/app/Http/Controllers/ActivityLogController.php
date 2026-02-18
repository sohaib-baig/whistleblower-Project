<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Activity\IndexMyActivityLogRequest;
use App\Http\Requests\Activity\IndexActivityLogRequest;
use App\Models\ActivityLog;
use App\Services\DateTimeService;
use App\Http\Resources\ActivityLogResource;
use Carbon\Carbon;

class ActivityLogController extends Controller
{
    use ApiResponse;

    public function indexMy(IndexMyActivityLogRequest $request, DateTimeService $dt)
    {
        $user = $request->user();
        $query = ActivityLog::query()->where('user_id', $user->id);
        $userTz = $user->timezone ?: 'UTC';

        // Search filter (action/subject fields)
        if ($search = trim($request->string('search')->toString())) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', '%'.$search.'%')
                  ->orWhere('subject_type', 'like', '%'.$search.'%')
                  ->orWhere('subject_id', 'like', '%'.$search.'%')
                  ->orWhere('ip', 'like', '%'.$search.'%');
            });
        }
        if ($request->filled('date_from')) {
            $fromUtc = Carbon::parse((string) $request->input('date_from'), $userTz ?: 'UTC')
                ->startOfDay()
                ->timezone('UTC');
            $query->where('created_at', '>=', $fromUtc);
        }
        if ($request->filled('date_to')) {
            $toUtc = Carbon::parse((string) $request->input('date_to'), $userTz ?: 'UTC')
                ->endOfDay()
                ->timezone('UTC');
            $query->where('created_at', '<=', $toUtc);
        }

        // Sorting
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();
        $allowedSorts = ['action', 'subject_type', 'subject_id', 'created_at', 'ip'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        } elseif ($sort === 'user') {
            $query->join('users', 'activity_logs.user_id', '=', 'users.id')
                  ->orderBy('users.name', $order)
                  ->select('activity_logs.*');
        } elseif ($sort === 'subject') {
            $query->orderBy('subject_type', $order)->orderBy('subject_id', $order);
        }

        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $logs = $query->with('user:id,name,email,avatar_path')->paginate($perPage);
        
        return $this->success([
            'data' => ActivityLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
            'links' => [
                'first' => $logs->url(1),
                'last' => $logs->url($logs->lastPage()),
                'prev' => $logs->previousPageUrl(),
                'next' => $logs->nextPageUrl(),
            ]
        ]);
    }

    public function indexAll(IndexActivityLogRequest $request, DateTimeService $dt)
    {
        if (! $request->user() || ! $request->user()->can('viewAny', ActivityLog::class)) {
            return $this->error('Forbidden', 403);
        }
        $query = ActivityLog::query();

        // User filter
        if ($userId = $request->string('user_id')->toString()) {
            $query->where('user_id', $userId);
        }

        // Search filter (searches across user name, email, action, subject)
        if ($search = trim($request->string('search')->toString())) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', '%'.$search.'%')
                  ->orWhere('subject_type', 'like', '%'.$search.'%')
                  ->orWhere('subject_id', 'like', '%'.$search.'%')
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', '%'.$search.'%')
                               ->orWhere('email', 'like', '%'.$search.'%');
                  });
            });
        }

        // Date range filters
        $userTz = $request->user()?->timezone ?: 'UTC';
        if ($request->filled('date_from')) {
            $fromUtc = Carbon::parse((string) $request->input('date_from'), $userTz ?: 'UTC')
                ->startOfDay()
                ->timezone('UTC');
            $query->where('created_at', '>=', $fromUtc);
        }
        if ($request->filled('date_to')) {
            $toUtc = Carbon::parse((string) $request->input('date_to'), $userTz ?: 'UTC')
                ->endOfDay()
                ->timezone('UTC');
            $query->where('created_at', '<=', $toUtc);
        }

        // Sorting
        $sort = $request->string('sort', 'created_at')->toString();
        $order = $request->string('order', 'desc')->toString();
        $allowedSorts = ['action', 'subject_type', 'subject_id', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order);
        } elseif ($sort === 'user') {
            $query->join('users', 'activity_logs.user_id', '=', 'users.id')
                  ->orderBy('users.name', $order)
                  ->select('activity_logs.*');
        } elseif ($sort === 'subject') {
            $query->orderBy('subject_type', $order)->orderBy('subject_id', $order);
        }

        $perPage = (int) $request->input('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $logs = $query->with('user:id,name,email,avatar_path')->paginate($perPage);
        
        return $this->success([
            'data' => ActivityLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
            'links' => [
                'first' => $logs->url(1),
                'last' => $logs->url($logs->lastPage()),
                'prev' => $logs->previousPageUrl(),
                'next' => $logs->nextPageUrl(),
            ]
        ]);
    }
}


