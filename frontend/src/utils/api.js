import axios from 'axios';

// Create an axios instance
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
console.log('Backend URL from environment:', backendUrl);

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
  api.defaults.headers.common['x-access-token'] = initialToken;
  api.defaults.headers.common['x-auth-token'] = initialToken;
}

// Add a request interceptor to include token and shop ID reliably
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['authorization'] = `Bearer ${token}`;
      config.headers['x-access-token'] = token;
      config.headers['x-auth-token'] = token;
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
        config.headers.set('x-access-token', token);
      }
    }
    
    // Add active shop ID if available
    const rawActiveShop = localStorage.getItem('activeShop') || localStorage.getItem('activeShopId');
    const isValidShopId = rawActiveShop && rawActiveShop !== 'null' && rawActiveShop !== 'undefined' && rawActiveShop !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(rawActiveShop);
    if (isValidShopId) {
      config.headers['x-shop-id'] = rawActiveShop;
      config.headers['X-Shop-Id'] = rawActiveShop;
      if (typeof config.headers.set === 'function') {
        config.headers.set('x-shop-id', rawActiveShop);
      }
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
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      if (!originalRequest.url?.includes('/api/auth/')) {
        console.log('401 error on non-auth endpoint');
      }
    }
    return Promise.reject(error);
  }
);

export default api;