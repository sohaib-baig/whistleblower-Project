<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Requests\Notification\StoreNotificationRequest;
use App\Http\Requests\Notification\UpdateNotificationRequest;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class NotificationController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Notification::class);
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $query = Notification::query();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->string('user_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->success($query->latest()->paginate($perPage));
    }

    /**
     * Get notifications for the current authenticated user
     */
    public function myNotifications(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));
        $query = Notification::where('user_id', $user->id);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $notifications = $query->latest()->paginate($perPage);

        return $this->success($notifications);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, Notification $notification)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        if ($notification->user_id !== $user->id) {
            return $this->error('Unauthorized', 403);
        }

        $notification->update(['status' => 'read']);

        return $this->success($notification, 'Notification marked as read');
    }

    /**
     * Mark all notifications as read for current user
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->error('Unauthenticated', 401);
        }

        $updated = Notification::where('user_id', $user->id)
            ->where('status', 'unread')
            ->update(['status' => 'read']);

        return $this->success(['updated_count' => $updated], 'All notifications marked as read');
    }

    public function store(StoreNotificationRequest $request)
    {
        $this->authorize('create', Notification::class);
        $data = $request->validated();
        $notification = Notification::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'message' => $data['message'],
            'status' => $data['status'] ?? 'unread',
        ]);
        return $this->success($notification, 'Notification created', 201);
    }

    public function show(Notification $notification)
    {
        $this->authorize('view', $notification);
        return $this->success($notification);
    }

    public function update(UpdateNotificationRequest $request, Notification $notification)
    {
        $this->authorize('update', $notification);
        $data = $request->validated();
        $notification->fill($data);
        $notification->save();
        return $this->success($notification, 'Notification updated');
    }

    public function destroy(Notification $notification)
    {
        $this->authorize('delete', $notification);
        $notification->delete();
        return $this->success(null, 'Notification deleted', 204);
    }
}


