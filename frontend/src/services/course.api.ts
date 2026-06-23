import axiosInstance from './axios';

export const courseApi = {
  getAllCourses: async (params?: any) => {
    const response = await axiosInstance.get('/courses', { params });
    return response.data;
  },
  getCourseById: async (id: string) => {
    const response = await axiosInstance.get(`/courses/${id}`);
    return response.data;
  },
  createCourse: async (data: any) => {
    const response = await axiosInstance.post('/courses', data);
    return response.data;
  },
  updateCourse: async (id: string, data: any) => {
    const response = await axiosInstance.put(`/courses/${id}`, data);
    return response.data;
  },
  deleteCourse: async (id: string) => {
    const response = await axiosInstance.delete(`/courses/${id}`);
    return response.data;
  }
};
