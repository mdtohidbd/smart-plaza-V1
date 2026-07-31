import axios from 'axios';

// Create an axios instance
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
console.log('Backend URL from environment:', backendUrl);
console.log('Environment variables available:', {
  VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  mode: import.meta.env.MODE
});

console.log('Creating API instance with baseURL:', backendUrl);

const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials (cookies) in requests
});

// Set initial token if it exists in localStorage
const initialToken = localStorage.getItem('token');
if (initialToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Add a request interceptor to include the token and log requests
api.interceptors.request.use(
  (config) => {
    console.log('API Request Config:', {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      fullURL: config.baseURL + config.url
    });
    
    // Always check for token in localStorage and add to request
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add active shop ID if available
    const activeShop = localStorage.getItem('activeShop');
    if (activeShop) {
      config.headers['x-shop-id'] = activeShop;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    console.log('Error config URL:', error.config?.url);
    // Only redirect to login for 401 errors on non-auth endpoints
    // This prevents logout on profile validation if it's a temporary network issue
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      // Don't redirect for auth-related requests, let AuthContext handle it
      if (!originalRequest.url.includes('/api/auth/')) {
        // Token might be expired, remove token and let AuthContext handle the logout
        console.log('401 error on non-auth endpoint, removing token');
        localStorage.removeItem('token');
        // Remove authorization header
        delete api.defaults.headers.common['Authorization'];
        // Instead of direct redirect, let the app handle this via auth context
        // This will allow proper cleanup and state management
      } else {
        console.log('401 error on auth endpoint, letting AuthContext handle it');
      }
    }
    return Promise.reject(error);
  }
);

export default api;