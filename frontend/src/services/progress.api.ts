import axiosInstance from './axios';

export interface Progress {
  _id: string;
  student: string;
  course: string;
  completedLessons: string[];
  progressPercentage: number;
  lastAccessedLesson: string | null;
  isCompleted: boolean;
  lastStudiedAt: string | null;
}

export interface ProgressResponse {
  status: string;
  data: {
    progress: Progress;
  };
}

export interface StatisticsResponse {
  status: string;
  data: {
    statistics: {
      totalEnrolled: number;
      completedCourses: number;
      ongoingCourses: number;
      details: Progress[];
    };
  };
}

export const progressApi = {
  /**
   * Lấy thống kê tiến độ học tập
   */
  getLearningStatistics: async (): Promise<StatisticsResponse> => {
    const response = await axiosInstance.get('/progress/statistics');
    return response.data;
  },

  /**
   * Lấy tiến độ học tập của một khóa học
   */
  getCourseProgress: async (courseId: string): Promise<ProgressResponse> => {
    const response = await axiosInstance.get(`/progress/${courseId}`);
    return response.data;
  },

  /**
   * Đánh dấu bài giảng đã hoàn thành
   */
  markComplete: async (courseId: string, lessonId: string): Promise<ProgressResponse> => {
    const response = await axiosInstance.post(`/progress/${courseId}/lessons/${lessonId}/complete`);
    return response.data;
  }
};
