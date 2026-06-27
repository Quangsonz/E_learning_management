import axiosInstance from './axios';

export interface Review {
  _id: string;
  student: {
    _id: string;
    name: string;
    avatar?: string;
  };
  course: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewData {
  rating: number;
  comment: string;
}

export const reviewApi = {
  getCourseReviews: (courseId: string, params?: { limit?: number; skip?: number; sort?: string }) => {
    return axiosInstance.get(`/courses/${courseId}/reviews`, { params });
  },

  createReview: (courseId: string, reviewData: ReviewData) => {
    return axiosInstance.post(`/courses/${courseId}/reviews`, reviewData);
  }
};
