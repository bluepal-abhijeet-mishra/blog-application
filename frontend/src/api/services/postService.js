import api from '../axios';

const postService = {
  getPosts: async (params) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  getPostBySlug: async (slug) => {
    const response = await api.get(`/posts/${slug}`);
    return response.data;
  },

  getPostForEdit: async (id) => {
    const response = await api.get(`/posts/id/${id}`);
    return response.data;
  },

  createPost: async (postData) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  updatePost: async (id, postData) => {
    const response = await api.put(`/posts/${id}`, postData);
    return response.data;
  },

  deletePost: async (id) => {
    await api.delete(`/posts/${id}`);
  },

  publishPost: async (id) => {
    const response = await api.patch(`/posts/${id}/publish`);
    return response.data;
  },

  unpublishPost: async (id) => {
    const response = await api.patch(`/posts/${id}/unpublish`);
    return response.data;
  },

  searchPosts: async (q, page = 0, size = 10, sort = 'relevance') => {
    const response = await api.get('/posts/search', { params: { q, page, size, sort } });
    return response.data;
  },

  getMyPosts: async (params) => {
    const response = await api.get('/posts/my-posts', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/posts/stats');
    return response.data;
  },
  
  toggleSave: async (id) => {
    await api.post(`/posts/${id}/save`);
  },

  getSavedPosts: async (params) => {
    const response = await api.get('/posts/saved-posts', { params });
    return response.data;
  },

  incrementShare: async (id) => {
    await api.post(`/posts/${id}/share`);
  },

  exportPostsJson: async () => {
    const response = await api.get('/posts/export/json', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'my-posts.json');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportStatsCsv: async () => {
    const response = await api.get('/posts/analytics/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'engagement-stats.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default postService;
