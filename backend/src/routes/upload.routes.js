const express = require('express');
const uploadController = require('../controllers/upload.controller');
const uploadMiddleware = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// Tất cả tính năng upload đều cần đăng nhập và chịu giới hạn rate limit upload
router.use(authMiddleware.protect);
router.use(uploadLimiter);

// Endpoint tải ảnh lên
router.post('/image', uploadMiddleware.uploadImage.single('file'), uploadController.uploadImage);

// Endpoint tải video lên (Chỉ Teacher/Admin)
router.post('/video', requireRole('teacher', 'admin'), uploadMiddleware.uploadVideo.single('file'), uploadController.uploadVideo);

// Endpoint tải tài liệu/bài nộp lên
router.post('/document', uploadMiddleware.uploadDocument.single('file'), uploadController.uploadDocument);

module.exports = router;
