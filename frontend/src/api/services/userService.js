import api from '../axios';

const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  getAuthorProfile: async (id) => {
    const response = await api.get(`/users/${id}/profile`);
    return response.data;
  },

  toggleFollow: async (id) => {
    const response = await api.post(`/users/${id}/follow`);
    return response.data;
  }
};

export default userService;
