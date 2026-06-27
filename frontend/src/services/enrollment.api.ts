import axiosInstance from './axios';

export interface Enrollment {
  _id: string;
  student: string;
  course: string | any;
  paymentStatus: 'pending' | 'completed' | 'failed';
  enrolledAt: string;
}

export interface EnrollmentResponse {
  status: string;
  data: {
    enrollment: Enrollment;
  };
}

export interface MyEnrollmentsResponse {
  status: string;
  results: number;
  data: {
    enrollments: Enrollment[];
  };
}

export const enrollmentApi = {
  /**
   * Lấy danh sách khóa học học viên đã đăng ký
   */
  getMyEnrollments: async (): Promise<MyEnrollmentsResponse> => {
    const response = await axiosInstance.get('/enrollments/my-enrollments');
    return response.data;
  },

  /**
   * Đăng ký khóa học
   */
  enrollCourse: async (courseId: string): Promise<EnrollmentResponse> => {
    const response = await axiosInstance.post('/enrollments', { courseId });
    return response.data;
  },

  /**
   * Hủy đăng ký khóa học
   */
  unenrollCourse: async (courseId: string): Promise<void> => {
    await axiosInstance.delete(`/enrollments/${courseId}`);
  }
};
