import axiosInstance from './axios';

export interface TeacherApplicationData {
  _id: string;
  student: { _id: string; name: string; email: string; avatar?: string };
  specialty: string;
  bio: string;
  resumeUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogData {
  _id: string;
  actor: { _id: string; name: string; email: string; avatar?: string; role: string };
  action: string;
  targetId?: string;
  targetModel?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const adminApi = {
  /**
   * Học viên gửi hồ sơ xin làm giảng viên - POST /api/admin/teacher-applications/apply
   */
  applyToTeach: async (payload: { specialty: string; bio: string; resumeUrl: string }): Promise<any> => {
    const response = await axiosInstance.post('/admin/teacher-applications/apply', payload);
    return response.data;
  },

  /**
   * Admin lấy danh sách hồ sơ ứng tuyển - GET /api/admin/teacher-applications
   */
  getTeacherApplications: async (params?: { status?: string; page?: number; limit?: number }): Promise<any> => {
    const response = await axiosInstance.get('/admin/teacher-applications', { params });
    return response.data;
  },

  /**
   * Admin xử lý hồ sơ ứng tuyển - POST /api/admin/teacher-applications/:id/action
   */
  processTeacherApplication: async (id: string, payload: { action: 'approve' | 'reject'; adminNotes?: string }): Promise<any> => {
    const response = await axiosInstance.post(`/admin/teacher-applications/${id}/action`, payload);
    return response.data;
  },

  /**
   * Admin lấy danh sách nhật ký thao tác - GET /api/admin/audit-logs
   */
  getAuditLogs: async (params?: { page?: number; limit?: number; search?: string }): Promise<any> => {
    const response = await axiosInstance.get('/admin/audit-logs', { params });
    return response.data;
  },

  /**
   * Admin lấy danh sách khóa học đang chờ duyệt - GET /api/admin/moderation/courses
   */
  getCoursesPendingReview: async (params?: { page?: number; limit?: number }): Promise<any> => {
    const response = await axiosInstance.get('/admin/moderation/courses', { params });
    return response.data;
  },

  /**
   * Admin lấy danh sách yêu cầu rút tiền - GET /api/admin/payouts
   */
  getPayoutRequests: async (params?: { status?: string; page?: number; limit?: number }): Promise<any> => {
    const response = await axiosInstance.get('/admin/payouts', { params });
    return response.data;
  },

  /**
   * Admin hoàn tất chuyển khoản yêu cầu rút tiền - PATCH /api/admin/payouts/:id/complete
   */
  completePayoutRequest: async (id: string, payload: { transactionProofUrl: string }): Promise<any> => {
    const response = await axiosInstance.patch(`/admin/payouts/${id}/complete`, payload);
    return response.data;
  },

  /**
   * Giảng viên gửi yêu cầu rút tiền - POST /api/admin/payouts/request
   */
  requestPayout: async (payload: { amount: number; bankInfo: { bankName: string; accountNumber: string; accountName: string } }): Promise<any> => {
    const response = await axiosInstance.post('/admin/payouts/request', payload);
    return response.data;
  },
};
