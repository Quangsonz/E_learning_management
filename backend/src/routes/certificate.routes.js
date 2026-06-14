const express = require('express');
const certificateController = require('../controllers/certificate.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// ==========================================
// PUBLIC API (Mọi người có thể xác minh chứng chỉ)
// ==========================================
// Ví dụ url: /api/certificates/verify/8F2B1A0D
router.get('/verify/:certificateId', certificateController.verifyCertificate);

// ==========================================
// PROTECTED API (Chỉ học viên đăng nhập mới được thao tác)
// ==========================================
router.use(authMiddleware.protect);

// Xem danh sách chứng chỉ cá nhân
router.get('/my-certificates', certificateController.getMyCertificates);

// Kích hoạt (nhận) chứng chỉ cho một khóa học
router.post('/claim/:courseId', certificateController.claimCertificate);

module.exports = router;
