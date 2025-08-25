import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Validate token
  async validateToken(token) {
    try {
      const response = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
    } catch (error) {
      // Even if logout fails on server, clear local token
      localStorage.removeItem('token');
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }
};

export default authService;
