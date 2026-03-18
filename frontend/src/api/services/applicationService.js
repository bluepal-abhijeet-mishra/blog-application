import axiosInstance from '../axios';

const applicationService = {
  submitApplication: async (bio) => {
    const response = await axiosInstance.post('/applications', { bio });
    return response.data;
  },

  getMyApplications: async () => {
    const response = await axiosInstance.get('/applications/my');
    return response.data;
  },

  getAllApplications: async (status) => {
    const params = status ? { status } : {};
    const response = await axiosInstance.get('/applications', { params });
    return response.data;
  },

  approveApplication: async (id) => {
    const response = await axiosInstance.put(`/applications/${id}/approve`);
    return response.data;
  },

  rejectApplication: async (id, reason) => {
    const response = await axiosInstance.put(`/applications/${id}/reject`, reason, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  }
};

export default applicationService;
