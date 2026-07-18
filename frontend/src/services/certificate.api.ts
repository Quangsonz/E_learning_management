import axiosInstance from './axios';

export interface Certificate {
  _id: string;
  student: string;
  course: {
    _id: string;
    title: string;
    thumbnailUrl?: string;
  } | string;
  certificateId: string;
  issueDate: string;
  pdfUrl?: string;
  validationUrl?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export const certificateApi = {
  getMyCertificates: async (): Promise<Certificate[]> => {
    const response = await axiosInstance.get('/certificates/my-certificates');
    return response.data.data.certificates;
  },

  claimCertificate: async (courseId: string): Promise<Certificate> => {
    const response = await axiosInstance.post(`/certificates/claim/${courseId}`);
    return response.data.data.certificate;
  },

  verifyCertificate: async (certificateId: string): Promise<{ isValid: boolean; certificate: Certificate }> => {
    const response = await axiosInstance.get(`/certificates/verify/${certificateId}`);
    return response.data.data;
  }
};

export default certificateApi;
