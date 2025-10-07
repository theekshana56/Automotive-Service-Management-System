import axios from 'axios';

// Use Vite proxy in dev; allow override via VITE_API_BASE
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? '' : '');

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists in localStorage
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and ensure proper JSON parsing
api.interceptors.response.use(
  (response) => {
    // Ensure response data is properly parsed
    if (response.data && typeof response.data === 'string') {
      try {
        // If response is a string, try to parse it as JSON
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        console.warn('Failed to parse response as JSON:', parseError);
        // Keep original string data if parsing fails
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage on auth error
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Dispatch a custom event to notify the auth context
      window.dispatchEvent(new CustomEvent('auth-error', { detail: { status: 401 } }));
    }
    return Promise.reject(error);
  }
);

export default api;
