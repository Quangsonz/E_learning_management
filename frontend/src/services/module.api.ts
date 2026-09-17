import { axiosInstance } from './axios';
import { Lesson } from './lesson.api';

export type Module = {
  _id: string;
  course: string;
  title: string | { vi?: string; en?: string };
  description?: string | { vi?: string; en?: string };
  order: number;
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
};

export type ModuleResponse = {
  status: string;
  data: {
    module: Module;
  };
};

export type ModuleListResponse = {
  status: string;
  results: number;
  data: {
    modules: Module[];
  };
};

export const moduleApi = {
  getModules: async (courseId: string): Promise<ModuleListResponse> => {
    const response = await axiosInstance.get(`/courses/${courseId}/modules`);
    return response.data;
  },

  getModule: async (courseId: string, moduleId: string): Promise<ModuleResponse> => {
    const response = await axiosInstance.get(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  createModule: async (courseId: string, data: { title: string | { vi?: string; en?: string }; description?: string; order?: number }): Promise<ModuleResponse> => {
    const response = await axiosInstance.post(`/courses/${courseId}/modules`, data);
    return response.data;
  },

  updateModule: async (courseId: string, moduleId: string, data: Partial<Module>): Promise<ModuleResponse> => {
    const response = await axiosInstance.patch(`/courses/${courseId}/modules/${moduleId}`, data);
    return response.data;
  },

  deleteModule: async (courseId: string, moduleId: string, cascade: boolean = false): Promise<void> => {
    await axiosInstance.delete(`/courses/${courseId}/modules/${moduleId}${cascade ? '?cascade=true' : ''}`);
  },

  reorderModules: async (courseId: string, modules: { id: string; order: number }[]): Promise<{ status: string; message: string }> => {
    const response = await axiosInstance.patch(`/courses/${courseId}/modules/reorder`, { modules });
    return response.data;
  }
};
