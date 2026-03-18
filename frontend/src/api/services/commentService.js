import api from '../axios';

const commentService = {
  getComments: async (postId, page = 0, size = 10) => {
    const response = await api.get(`/posts/${postId}/comments`, { params: { page, size } });
    return response.data;
  },

  addComment: async (postId, content) => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    await api.delete(`/comments/${commentId}`);
  }
};

export default commentService;
