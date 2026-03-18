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

  searchPosts: async (q, page = 0, size = 10) => {
    const response = await api.get('/posts/search', { params: { q, page, size } });
    return response.data;
  },

  getMyPosts: async () => {
    const response = await api.get('/posts/my-posts');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/posts/stats');
    return response.data;
  }
};

export default postService;
