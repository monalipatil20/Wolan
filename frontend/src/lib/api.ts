// src/lib/api.ts

import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || '/api/v1';
const baseURL = rawBaseURL.replace(/([^:/])\/+/g, '$1/');

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/logout') || requestUrl.includes('/auth/refresh-token') || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/auth/refresh-token', {}, { withCredentials: true });
        const refreshedToken = data.accessToken || data.data?.accessToken;
        if (!refreshedToken) {
          throw new Error('Missing refreshed access token');
        }

        localStorage.setItem('accessToken', refreshedToken);
        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Notification API functions
export const notificationApi = {
  // Get notifications with filtering
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    category?: string;
  }) => api.get('/auth/notifications', { params }),

  // Get single notification
  getNotification: (id: string) => api.get(`/auth/notifications/${id}`),

  // Create notification
  createNotification: (data: {
    type: 'sms' | 'whatsapp' | 'email' | 'push';
    category: string;
    recipient_id: string;
    recipient_phone?: string;
    recipient_email?: string;
    recipient_fcm_token?: string;
    template_key: string;
    variables?: Record<string, any>;
    priority?: 'high' | 'normal' | 'low';
    scheduled_at?: string;
    related_type?: string;
    related_id?: string;
  }) => api.post('/auth/notifications', data),

  // Bulk create notifications
  bulkCreateNotifications: (data: { notifications: any[] }) =>
    api.post('/auth/notifications/bulk', data),

  // Update notification status
  updateNotificationStatus: (id: string, status: string, failure_reason?: string) =>
    api.patch(`/auth/notifications/${id}/status`, { status, failure_reason }),

  // Retry failed notification
  retryNotification: (id: string) => api.post(`/auth/notifications/${id}/retry`),

  // Delete notification
  deleteNotification: (id: string) => api.delete(`/auth/notifications/${id}`),

  // Get notification statistics
  getNotificationStats: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/auth/notifications/stats', { params }),
};

