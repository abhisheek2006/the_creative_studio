import axios from 'axios';

// Resolve API base:
//   - explicit VITE_API_URL overrides everything
//   - otherwise use same-origin /api:
//       * dev  -> the Vite dev server proxies /api to http://localhost:5000
//                 (see vite.config.js), so requests are same-origin and never
//                 trip CORS regardless of the host/port the app is opened on
//       * prod -> same origin (Express serves the build) or Vercel rewrite
let baseURL;
if (import.meta.env.VITE_API_URL) {
  baseURL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
} else {
  baseURL = '/api';
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('tcs_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired / invalid — clear admin session so /admin routes redirect.
      const path = error.config?.url || '';
      if (path.includes('/admin/')) {
        sessionStorage.removeItem('tcs_admin_token');
        if (window.location.pathname.startsWith('/admin') && !window.location.pathname.endsWith('/login')) {
          window.location.assign('/admin/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export function extractError(error, fallback = 'Something went wrong. Please try again.') {
  const message = error?.response?.data?.message;
  if (message) return message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error?.response) return 'Cannot reach the server. Please check your connection.';
  return fallback;
}

export default api;