import { sanctum } from 'src/lib/axios-sanctum';

export interface INotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  redirect_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface INotificationsResponse {
  data: INotification[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Fetch notifications for the current user
 */
export async function fetchMyNotifications(status?: string): Promise<INotificationsResponse> {
  try {
    const params: any = {};
    if (status) {
      params.status = status;
    }
    const res = await sanctum.get('/api/v1/notifications/my', { params });
    return res.data as INotificationsResponse;
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    throw new Error(error.message || 'Failed to fetch notifications');
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<INotification> {
  try {
    const res = await sanctum.post(`/api/v1/notifications/${notificationId}/mark-as-read`);
    return res.data as INotification;
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    throw new Error(error.message || 'Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ updated_count: number }> {
  try {
    const res = await sanctum.post('/api/v1/notifications/mark-all-as-read');
    return res.data as { updated_count: number };
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    throw new Error(error.message || 'Failed to mark all notifications as read');
  }
}
