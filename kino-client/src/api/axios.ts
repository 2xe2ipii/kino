import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5002/api', // This matches your .NET backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// This "Interceptor" runs before every single request.
// It automatically attaches the Token if we have one.
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

export default api;