import { axiosInstance } from './axios';

export type Lesson = {
  _id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  course: string;
  createdAt: string;
  updatedAt: string;
};

export type LessonResponse = {
  status: string;
  data: {
    lesson: Lesson;
  };
};

export type LessonListResponse = {
  status: string;
  results: number;
  data: {
    lessons: Lesson[];
  };
};

export const lessonApi = {
  getLessons: async (courseId: string): Promise<LessonListResponse> => {
    const response = await axiosInstance.get(`/courses/${courseId}/lessons`);
    return response.data;
  },

  getLesson: async (courseId: string, lessonId: string): Promise<LessonResponse> => {
    const response = await axiosInstance.get(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  createLesson: async (courseId: string, data: Partial<Lesson>): Promise<LessonResponse> => {
    const response = await axiosInstance.post(`/courses/${courseId}/lessons`, data);
    return response.data;
  },

  updateLesson: async (courseId: string, lessonId: string, data: Partial<Lesson>): Promise<LessonResponse> => {
    const response = await axiosInstance.patch(`/courses/${courseId}/lessons/${lessonId}`, data);
    return response.data;
  },

  deleteLesson: async (courseId: string, lessonId: string): Promise<void> => {
    await axiosInstance.delete(`/courses/${courseId}/lessons/${lessonId}`);
  }
};
