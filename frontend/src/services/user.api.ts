import axiosInstance from './axios';

export const userApi = {
  getAllUsers: async (params?: any) => {
    const response = await axiosInstance.get('/users', { params });
    return response.data;
  }
};
