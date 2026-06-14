const express = require('express');
const progressController = require('../controllers/progress.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Chỉ user đã đăng nhập (Học viên) mới theo dõi được tiến trình
router.use(authMiddleware.protect);

// Lấy thống kê tiến trình học tập của toàn bộ các khóa
router.get('/statistics', progressController.getLearningStatistics);

// Lấy tiến trình của 1 khóa học cụ thể
router.get('/:courseId', progressController.getCourseProgress);

// Đánh dấu bài giảng là đã hoàn thành
router.post('/:courseId/lessons/:lessonId/complete', progressController.markComplete);

module.exports = router;
