import axios from 'axios';

// In production, use Next.js API proxy to avoid cross-domain cookie issues
// In development, call backend directly
export const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        // Production: use Next.js API proxy (same-origin, no cross-domain cookie issues)
        return '/api';
    }
    // Server-side: use env or default
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

// For static assets like images, always use the real backend URL
export const getBackendUrl = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return 'https://api-backend-prod.stackject.cloud';
    }
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
