import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include JWT token
instance.interceptors.request.use(
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

// Add response interceptor to handle token expiration
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/setup') ||
      requestUrl.includes('/auth/recovery-question') ||
      requestUrl.includes('/auth/verify-recovery-answer') ||
      requestUrl.includes('/auth/recover-credentials');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
