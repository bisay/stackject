import axios from 'axios';

// Auto-detect: jika diakses dari localhost, gunakan localhost API
// Jika dari domain production, gunakan API production
const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        // Production
        return 'https://api-backend-prod.stackject.cloud';
    }
    // Server-side: use env or default
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const api = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true, // Important for HttpOnly Cookies
});

// Update baseURL on client side
if (typeof window !== 'undefined') {
    api.defaults.baseURL = getApiUrl();
}

export default api;
