import axiosInstance from './axios';

export interface CourseData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  instructor: { _id: string; name: string; avatar?: string; role?: string };
  category: { _id: string; name: string; slug: string };
  status: 'draft' | 'published';
  thumbnailUrl?: string;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListResponse {
  status: string;
  results: number;
  data: {
    courses: CourseData[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface CourseResponse {
  status: string;
  data: {
    course: CourseData;
  };
}

export const courseApi = {
  getAllCourses: async (params?: any): Promise<CourseListResponse> => {
    const response = await axiosInstance.get('/courses', { params });
    return response.data;
  },
  getMyCourses: async (params?: any): Promise<CourseListResponse> => {
    const response = await axiosInstance.get('/courses/my-courses', { params });
    return response.data;
  },
  getCourseById: async (id: string): Promise<CourseResponse> => {
    const response = await axiosInstance.get(`/courses/${id}`);
    return response.data;
  },
  createCourse: async (data: any): Promise<CourseResponse> => {
    const response = await axiosInstance.post('/courses', data);
    return response.data;
  },
  updateCourse: async (id: string, data: any): Promise<CourseResponse> => {
    const response = await axiosInstance.patch(`/courses/${id}`, data);
    return response.data;
  },
  deleteCourse: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete(`/courses/${id}`);
    return response.data;
  },
  getRecommendations: async (): Promise<any> => {
    const response = await axiosInstance.get('/courses/recommendations');
    return response.data;
  }
};
