import api from '../axios';

const notificationService = {
  getNotifications: async (limit = 20) => {
    const response = await api.get('/notifications', { params: { limit } });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    await api.patch('/notifications/read-all');
  },
};

export default notificationService;
