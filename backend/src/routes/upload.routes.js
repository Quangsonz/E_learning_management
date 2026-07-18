const express = require('express');
const uploadController = require('../controllers/upload.controller');
const uploadMiddleware = require('../middlewares/upload.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Tất cả tính năng upload đều cần đăng nhập
router.use(authMiddleware.protect);

// Endpoint tải ảnh lên
router.post('/image', uploadMiddleware.uploadImage.single('file'), uploadController.uploadImage);

// Endpoint tải video lên
router.post('/video', uploadMiddleware.uploadVideo.single('file'), uploadController.uploadVideo);

// Endpoint tải tài liệu/bài nộp lên
router.post('/document', uploadMiddleware.uploadDocument.single('file'), uploadController.uploadDocument);

module.exports = router;

