import axios from 'axios';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/api' : 'http://localhost:5200/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log("Added Token to Header:", token); // Debug
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
