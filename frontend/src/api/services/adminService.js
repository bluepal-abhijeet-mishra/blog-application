import api from '../axios';

const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
  },

  getAllPosts: async (page = 0, size = 10) => {
    const response = await api.get('/admin/posts', { params: { page, size } });
    return response.data;
  },

  getAllComments: async (page = 0, size = 10) => {
    const response = await api.get('/admin/comments', { params: { page, size } });
    return response.data;
  },

  getPlatformStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  forceDeleteComment: async (id) => {
    await api.delete(`/admin/comments/${id}`);
  }
};

export default adminService;
