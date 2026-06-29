import axiosInstance from './axios';

export const paymentApi = {
  createPaymentIntent: async (courseId: string) => {
    const response = await axiosInstance.post('/payments/create-payment-intent', { courseId });
    return response.data;
  },
};
