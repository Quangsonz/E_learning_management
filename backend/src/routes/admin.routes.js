const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const adminController = require('../controllers/admin.controller');
const auditMiddleware = require('../middlewares/auditLog.middleware');

const router = express.Router();

// Bắt buộc đăng nhập
router.use(authMiddleware.protect);

// Học viên đăng ký ứng tuyển giảng viên
router.post('/teacher-applications/apply', requireRole('student'), adminController.applyToTeach);
router.get('/teacher-applications/my-status', requireRole('student'), adminController.getMyApplicationStatus);


// Giảng viên gửi yêu cầu rút tiền
router.post('/payouts/request', requireRole('teacher'), adminController.requestPayout);

// ==========================================
// ĐƯỜNG DẪN DÀNH RIÊNG CHO QUẢN TRỊ VIÊN
// ==========================================
router.use(requireRole('admin'));

// Quản lý đơn ứng tuyển giảng viên
router.get('/teacher-applications', adminController.getTeacherApplications);
router.post('/teacher-applications/:id/action', auditMiddleware.logAdminAction('TEACHER_APPLICATION_PROCESS', 'TeacherApplication'), adminController.processTeacherApplication);

// Quản lý yêu cầu rút tiền giảng viên
router.get('/payouts', adminController.getPayoutRequests);
router.patch('/payouts/:id/complete', auditMiddleware.logAdminAction('PAYOUT_REQUEST_COMPLETE', 'PayoutRequest'), adminController.completePayoutRequest);

// Xem nhật ký thao tác
router.get('/audit-logs', requirePermission('view_statistics'), adminController.getAuditLogs);

// Xem danh sách khóa học đang chờ kiểm duyệt
router.get('/moderation/courses', adminController.getCoursesPendingReview);

module.exports = router;
