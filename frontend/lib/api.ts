import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    withCredentials: true, // Important for HttpOnly Cookies
});

export default api;
