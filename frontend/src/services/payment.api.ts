import axiosInstance from './axios';

export const paymentApi = {
  createPaymentIntent: async (courseId: string) => {
    const response = await axiosInstance.post('/payments/create-payment-intent', { courseId });
    return response.data;
  },
  createQROrder: async (courseId: string, testAmount?: number) => {
    const response = await axiosInstance.post('/payments/create-qr-order', { courseId, testAmount });
    return response.data;
  },
  confirmQRPayment: async (courseId: string) => {
    const response = await axiosInstance.post('/payments/confirm-qr-payment', { courseId });
    return response.data;
  },
};
