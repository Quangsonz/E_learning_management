import axiosInstance from './axios';

export const paymentApi = {
  createPaymentIntent: async (courseId: string) => {
    const response = await axiosInstance.post('/payments/create-payment-intent', { courseId });
    return response.data;
  },

  createQROrder: async (courseId: string) => {
    const response = await axiosInstance.post('/payments/create-qr-order', { courseId });
    return response.data;
  },

  getOrderStatus: async (orderId: string) => {
    const response = await axiosInstance.get(`/payments/orders/${orderId}`);
    return response.data;
  },

  confirmTransfer: async (orderId: string, transactionReference?: string) => {
    const response = await axiosInstance.post(`/payments/orders/${orderId}/confirm-transfer`, { transactionReference });
    return response.data;
  },

  demoSimulatePayment: async (orderId: string) => {
    const response = await axiosInstance.post('/payments/demo-simulate', { orderId });
    return response.data;
  },

  adminVerifyOrder: async (orderId: string, payload?: { bankTransactionId?: string; adminNote?: string }) => {
    const response = await axiosInstance.patch(`/payments/admin/orders/${orderId}/verify`, payload || {});
    return response.data;
  },

  adminRejectOrder: async (orderId: string, reason: string) => {
    const response = await axiosInstance.patch(`/payments/admin/orders/${orderId}/reject`, { reason });
    return response.data;
  },

  // Legacy fallback
  confirmQRPayment: async (courseId: string) => {
    const response = await axiosInstance.post('/payments/confirm-qr-payment', { courseId });
    return response.data;
  },
};
