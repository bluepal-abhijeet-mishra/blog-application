import api from '../axios';

const metadataService = {
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  }
};

export default metadataService;
