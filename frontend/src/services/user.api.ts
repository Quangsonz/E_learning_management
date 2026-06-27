import axiosInstance from './axios';
import { AuthUser } from '../store/slices/authSlice';

// ==========================================
// TYPES
// ==========================================

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UsersListResponse {
  status: string;
  results: number;
  data: {
    users: AuthUser[];
  };
}

export interface UserResponse {
  status: string;
  data: {
    user: AuthUser;
  };
}

export interface LeaderboardUser {
  _id: string;
  name: string;
  avatar: string;
  xp: number;
  studyStreakDays: number;
}

export interface LeaderboardResponse {
  status: string;
  data: {
    leaderboard: LeaderboardUser[];
  };
}

export interface WishlistResponse {
  status: string;
  data: {
    wishlist: any[]; // Course objects
  };
}

export interface ToggleWishlistResponse {
  status: string;
  message: string;
  data: {
    wishlist: string[];
    isAdded: boolean;
  };
}

// ==========================================
// USER API
// ==========================================

export const userApi = {
  /**
   * Lấy danh sách users (Admin & Teacher) - GET /api/users
   */
  getAllUsers: async (params?: Record<string, any>): Promise<UsersListResponse> => {
    const response = await axiosInstance.get('/users', { params });
    return response.data;
  },

  /**
   * Lấy wishlist của người dùng - GET /api/users/wishlist
   */
  getWishlist: async (): Promise<WishlistResponse> => {
    const response = await axiosInstance.get('/users/wishlist');
    return response.data;
  },

  /**
   * Toggle khóa học vào wishlist - POST /api/users/wishlist
   */
  toggleWishlist: async (courseId: string): Promise<ToggleWishlistResponse> => {
    const response = await axiosInstance.post('/users/wishlist', { courseId });
    return response.data;
  },

  /**
   * Lấy danh sách Leaderboard - GET /api/users/leaderboard
   */
  getLeaderboard: async (limit: number = 20): Promise<LeaderboardResponse> => {
    const response = await axiosInstance.get('/users/leaderboard', { params: { limit } });
    return response.data;
  },

  /**
   * Lấy profile cá nhân - GET /api/users/me
   */
  getMyProfile: async (): Promise<UserResponse> => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  /**
   * Cập nhật profile cá nhân - PATCH /api/users/updateMe
   */
  updateMyProfile: async (data: UpdateProfilePayload): Promise<UserResponse> => {
    const response = await axiosInstance.patch('/users/updateMe', data);
    return response.data;
  },

  /**
   * Thay đổi mật khẩu - PATCH /api/users/changePassword
   */
  changePassword: async (data: ChangePasswordPayload): Promise<{ status: string; message: string }> => {
    const response = await axiosInstance.patch('/users/changePassword', data);
    return response.data;
  },

  /**
   * Lấy user theo ID (Admin) - GET /api/users/:id
   */
  getUserById: async (id: string): Promise<UserResponse> => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Cập nhật user (Admin) - PATCH /api/users/:id
   */
  updateUser: async (id: string, data: Partial<AuthUser>): Promise<UserResponse> => {
    const response = await axiosInstance.patch(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Xóa user (Admin) - DELETE /api/users/:id
   */
  deleteUser: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/users/${id}`);
  },
};
