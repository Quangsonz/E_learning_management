import axiosClient from './axios';

export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadVideo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosClient.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
