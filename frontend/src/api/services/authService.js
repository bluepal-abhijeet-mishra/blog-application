import api from '../axios';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const data = response.data;
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Backend returns flat: { token, userId, email, role, displayName }
      const user = {
        id: data.userId,
        email: data.email,
        role: data.role,
        displayName: data.displayName,
      };
      localStorage.setItem('user', JSON.stringify(user));
      return { token: data.token, user };
    }
    return data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    const data = response.data;
    if (data.token) {
      localStorage.setItem('token', data.token);
      const user = {
        id: data.userId,
        email: data.email,
        role: data.role,
        displayName: data.displayName,
      };
      localStorage.setItem('user', JSON.stringify(user));
      return { token: data.token, user };
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      if (!user || user === 'undefined' || user === 'null') return null;
      return JSON.parse(user);
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('user');
      return null;
    }
  }
};

export default authService;
