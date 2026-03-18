import api from '../axios';

const categoryRequestService = {
  submitRequest: async ({ name, reason }) => {
    const response = await api.post('/category-requests', { name, reason });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/category-requests/my');
    return response.data;
  },

  getAdminRequests: async (status = 'PENDING') => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/category-requests', { params });
    return response.data;
  },

  approveRequest: async (id, note = '') => {
    const response = await api.put(`/admin/category-requests/${id}/approve`, { note });
    return response.data;
  },

  rejectRequest: async (id, note) => {
    const response = await api.put(`/admin/category-requests/${id}/reject`, { note });
    return response.data;
  },
};

export default categoryRequestService;
