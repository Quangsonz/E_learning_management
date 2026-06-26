import axiosInstance from './axios';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  slug?: string;
  description?: string;
}

export interface CategoryListResponse {
  status: string;
  results: number;
  data: {
    categories: Category[];
  };
}

export interface CategoryResponse {
  status: string;
  data: {
    category: Category;
  };
}

export const categoryApi = {
  // Public
  getAllCategories: async (): Promise<CategoryListResponse> => {
    const response = await axiosInstance.get('/categories');
    return response.data;
  },

  getCategoryById: async (id: string): Promise<CategoryResponse> => {
    const response = await axiosInstance.get(`/categories/${id}`);
    return response.data;
  },

  // Admin only
  createCategory: async (data: CategoryRequest): Promise<CategoryResponse> => {
    const response = await axiosInstance.post('/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: Partial<CategoryRequest>): Promise<CategoryResponse> => {
    const response = await axiosInstance.patch(`/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  }
};
