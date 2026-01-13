import axios from 'axios';

const api = axios.create({
    // Make sure this matches your Kino.Server port!
    // If your backend says "Now listening on: http://localhost:5002", use that.
    baseURL: 'http://localhost:5002/api', 
    withCredentials: true // Important for CORS
});

// Add Interceptor to attach Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;