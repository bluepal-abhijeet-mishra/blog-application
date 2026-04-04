import api from '../axios';

const commentService = {
  getComments: async (postId, page = 0, size = 10) => {
    const response = await api.get(`/posts/${postId}/comments`, { params: { page, size } });
    return response.data;
  },

  addComment: async (postId, payload) => {
    const response = await api.post(`/posts/${postId}/comments`, payload);
    return response.data;
  },

  deleteComment: async (commentId) => {
    await api.delete(`/comments/${commentId}`);
  },
  
  toggleLike: async (commentId) => {
    await api.post(`/comments/${commentId}/toggle-like`);
  },
  
  getCommentLikes: async (commentId) => {
    const response = await api.get(`/comments/${commentId}/likes`);
    return response.data;
  }
};

export default commentService;
