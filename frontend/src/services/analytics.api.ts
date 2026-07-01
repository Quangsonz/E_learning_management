import axiosInstance from './axios';

export const analyticsApi = {
  getAdminDashboard: async () => {
    const response = await axiosInstance.get('/analytics/admin');
    return response.data;
  },
  getTeacherDashboard: async () => {
    const response = await axiosInstance.get('/analytics/teacher');
    return response.data;
  },
  /**
   * Lấy danh sách orders và revenue summary (Admin only)
   * GET /api/analytics/orders
   */
  getOrderStats: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await axiosInstance.get('/analytics/orders', { params });
    return response.data;
  }
};

