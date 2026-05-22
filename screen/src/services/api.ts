import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Auto-attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flashmeet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
