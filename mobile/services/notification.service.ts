import apiClient from './api';
import { NotificationItem, NotificationPreference } from '../types';

export interface NotificationFetchParams {
  page?: number;
  limit?: number;
  unread_only?: boolean;
  search?: string;
  category?: string;
}

export interface NotificationResponse {
  notifications: NotificationItem[];
  unread_count: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationService = {
  /**
   * Fetch paginated user notifications with unread count
   */
  fetchNotifications: async (params: NotificationFetchParams = {}): Promise<NotificationResponse> => {
    try {
      const response = await apiClient.get('/notifications', { params });
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        return {
          notifications: Array.isArray(data.notifications) ? data.notifications : [],
          unread_count: typeof data.unread_count === 'number' ? data.unread_count : 0,
          pagination: data.pagination || { total: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 }
        };
      }
      return { notifications: [], unread_count: 0 };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Fetch unread notification count
   */
  fetchUnreadCount: async (): Promise<{ unread_count: number; notifications: NotificationItem[] }> => {
    try {
      const response = await apiClient.get('/notifications/unread');
      if (response.data?.success && response.data?.data) {
        return {
          unread_count: typeof response.data.data.unread_count === 'number' ? response.data.data.unread_count : 0,
          notifications: Array.isArray(response.data.data.notifications) ? response.data.data.notifications : []
        };
      }
      return { unread_count: 0, notifications: [] };
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }
  },

  /**
   * Mark a specific notification as read
   */
  markNotificationRead: async (id: string): Promise<boolean> => {
    try {
      const response = await apiClient.put(`/notifications/${id}/read`, { id });
      return response.data?.success === true;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllNotificationsRead: async (): Promise<boolean> => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return response.data?.success === true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Fetch notification preferences
   */
  fetchNotificationPreferences: async (): Promise<NotificationPreference> => {
    try {
      // Try /notifications/settings endpoint first, then /notifications/preferences fallback
      const response = await apiClient.get('/notifications/settings');
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return {
        email_enabled: true,
        sms_enabled: true,
        app_enabled: true,
        marketing_enabled: true,
        commission_enabled: true,
        kyc_enabled: true,
        application_enabled: true,
        language: 'en',
        frequency: 'instant'
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (preferences: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    try {
      const response = await apiClient.put('/notifications/settings', preferences);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return preferences as NotificationPreference;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }
};

export default notificationService;
