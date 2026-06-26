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
    // Nếu lỗi 401 và không phải đang gọi API login/register
    if (
      err.response && 
      err.response.status === 401 && 
      !err.config.url?.includes('/auth/login') && 
      !err.config.url?.includes('/auth/register')
    ) {
      // Bị logout (có thể do token hết hạn)
      store.dispatch(clearAuth());
      // Xóa header Authorization
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
