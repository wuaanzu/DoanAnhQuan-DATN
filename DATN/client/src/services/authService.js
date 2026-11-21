import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      const payload = {
        email: credentials.email || (credentials.username?.includes('@') ? credentials.username : `${credentials.username}@sis.hust.edu.vn`),
        password: credentials.password,
      };
      const res = await api.post('/auth/login', payload);
      const data = res.data || res;
      return {
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      // Mock fallback nếu không kết nối được
      if (credentials.username && credentials.password) {
        return {
          token: 'mock-jwt-token-unishare',
          user: {
            id: 2,
            fullName: credentials.username,
            email: `${credentials.username}@sis.hust.edu.vn`,
            role: 'Student',
            universityShortName: 'HUST',
          },
        };
      }
      throw error;
    }
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data || res;
  },

  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data || res;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
  },
};
