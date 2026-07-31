import { useQuery, useQueryClient } from 'react-query';
import api from '../utils/api';

export function useNotifications(options = {}) {
  const queryClient = useQueryClient();
  const { enabled = true, refetchInterval = 120000 } = options;

  const query = useQuery(
    'notifications',
    async () => {
      console.log('[FRONTEND NOTIFICATIONS] Fetching notifications from API...');
      const res = await api.get('/api/notifications');
      console.log('[FRONTEND NOTIFICATIONS] Received response:', {
        success: res.data.success,
        count: res.data.count,
        unreadCount: res.data.unreadCount,
        notifications: res.data.data?.length || 0
      });
      if (res.data.data && res.data.data.length > 0) {
        console.log('[FRONTEND NOTIFICATIONS] Sample notifications:', res.data.data.slice(0, 3).map(n => ({
          id: n._id,
          type: n.type,
          message: n.message.substring(0, 50),
          isRead: n.isRead,
          source: n.computed ? 'live' : 'stored'
        })));
      }
      return res.data;
    },
    {
      enabled,
      refetchInterval,
      staleTime: 30000,
      retry: 1,
      onError: (error) => {
        console.error('[FRONTEND NOTIFICATIONS] Error fetching notifications:', error);
        console.error('[FRONTEND NOTIFICATIONS] Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
  );

  const markAsRead = async (id) => {
    if (!id) return;
    await api.put(`/api/notifications/${id}/read`);
    await queryClient.invalidateQueries('notifications');
  };

  const markAllAsRead = async () => {
    await api.put('/api/notifications/read-all');
    await queryClient.invalidateQueries('notifications');
  };

  const removeNotification = async (id) => {
    if (!id) return;
    await api.delete(`/api/notifications/${id}`);
    await queryClient.invalidateQueries('notifications');
  };

  return {
    ...query,
    items: query.data?.data || [],
    unreadCount: query.data?.unreadCount ?? 0,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
}
