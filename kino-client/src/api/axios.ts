import axios from 'axios';

// Use the environment variable, or fallback to localhost for safety
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const api = axios.create({
    baseURL: `${BASE_URL}/api` // Note: We append /api here
});

// --- AUTOMATICALLY ATTACH TOKEN ---
api.interceptors.request.use((config) => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // 2. If token exists, add it to the Authorization header
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;