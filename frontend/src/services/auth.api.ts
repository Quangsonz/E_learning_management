import axiosInstance from './axios';
import { AuthUser } from '../store/slices/authSlice';

// ==========================================
// TYPES
// ==========================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  role?: 'student' | 'teacher';
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: AuthUser;
  };
}

export interface MessageResponse {
  status: string;
  message: string;
}

// ==========================================
// AUTH API
// ==========================================

export const authApi = {
  /**
   * Đăng nhập - POST /api/auth/login
   */
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  /**
   * Đăng ký - POST /api/auth/register
   */
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  /**
   * Đăng xuất - POST /api/auth/logout
   */
  logout: async (): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  /**
   * Quên mật khẩu - POST /api/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Đặt lại mật khẩu - PATCH /api/auth/reset-password/:token
   */
  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.patch(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  /**
   * Lấy profile cá nhân - GET /api/users/me
   */
  getProfile: async (): Promise<{ status: string; data: { user: AuthUser } }> => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },
};
