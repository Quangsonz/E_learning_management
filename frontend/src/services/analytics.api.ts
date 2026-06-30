import axiosInstance from './axios';

export const analyticsApi = {
  getAdminDashboard: async () => {
    const response = await axiosInstance.get('/analytics/admin');
    return response.data;
  },
  getTeacherDashboard: async () => {
    const response = await axiosInstance.get('/analytics/teacher');
    return response.data;
  }
};
