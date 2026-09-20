import axios from 'axios';
import { store } from '../store/store';
import { clearAuth } from '../store/slices/authSlice';

// Normalized API Base URL (ensures it ends with /api if not present, trims trailing slashes)
const getApiBase = (): string => {
  const rawUrl = import.meta.env.VITE_API_URL;
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
    let clean = rawUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api') && !clean.includes('/api/')) {
      clean += '/api';
    }
    return clean;
  }
  return '/api';
};

export const API_BASE = getApiBase();

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60s timeout for Render free tier cold-start
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  
  const currentLang = localStorage.getItem('language') || 'vi';
  if (config.headers) {
    config.headers['Accept-Language'] = currentLang;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response && 
      err.response.status === 401 && 
      !err.config.url?.includes('/auth/login') && 
      !err.config.url?.includes('/auth/register')
    ) {
      store.dispatch(clearAuth());
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
