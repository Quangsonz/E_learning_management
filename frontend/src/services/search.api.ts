import axiosInstance from './axios';

export interface SearchCourseItem {
  _id: string;
  title: string | { vi?: string; en?: string };
  slug: string;
  thumbnailUrl?: string;
  price: number;
  estimatedPrice?: number;
  discountPercentage?: number;
  averageRating: number;
  status: string;
  instructor?: { name: string; avatar?: string };
  category?: { name: string | { vi?: string; en?: string }; slug: string };
}

export interface SearchLessonItem {
  _id: string;
  title: string | { vi?: string; en?: string };
  duration: number;
  order: number;
  provider?: string;
  course: {
    _id: string;
    title: string | { vi?: string; en?: string };
    slug: string;
    status: string;
  };
}

export interface SearchCategoryItem {
  _id: string;
  name: string | { vi?: string; en?: string };
  slug: string;
  description?: string | { vi?: string; en?: string };
}

export interface SearchInstructorItem {
  _id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface SearchUserItem {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isActive?: boolean;
}

export interface SearchOrderItem {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  stripePaymentIntentId?: string;
  user?: { name: string; email: string };
  course?: { title: string | { vi?: string; en?: string }; slug: string };
}

export interface SearchApplicationItem {
  _id: string;
  specialty: string;
  status: string;
  createdAt: string;
  student?: { name: string; email: string; avatar?: string };
}

export interface SearchResultsData {
  query: string;
  results: {
    courses: SearchCourseItem[];
    lessons: SearchLessonItem[];
    categories: SearchCategoryItem[];
    instructors: SearchInstructorItem[];
    users: SearchUserItem[];
    orders: SearchOrderItem[];
    applications: SearchApplicationItem[];
  };
  totalResults: number;
}

export interface SearchResponse {
  status: string;
  data: SearchResultsData;
}

export type SearchCategoryType = 'all' | 'courses' | 'lessons' | 'categories' | 'instructors' | 'users' | 'orders' | 'applications';

export const searchApi = {
  globalSearch: async (params: { q: string; type?: SearchCategoryType; limit?: number }): Promise<SearchResponse> => {
    const response = await axiosInstance.get('/search', { params });
    return response.data;
  }
};
