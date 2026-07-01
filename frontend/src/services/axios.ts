import axios from 'axios';
import { store } from '../store/store';
import { setAuth, clearAuth } from '../store/slices/authSlice';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
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
