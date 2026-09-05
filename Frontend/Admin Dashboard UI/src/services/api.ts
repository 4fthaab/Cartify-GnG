import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Make sure this matches your FastAPI port!
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically log out if the token expires (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default api;