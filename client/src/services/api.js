import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT
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

// Response Interceptor: Error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If JWT expired or not authorized, optional logout trigger
    if (error.response && error.response.status === 401) {
      // Clear token details
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on landing or login page, we can redirect
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
