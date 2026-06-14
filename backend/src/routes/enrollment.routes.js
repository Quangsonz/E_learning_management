const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

// Mọi hành động đăng ký đều cần user phải đăng nhập
router.use(authMiddleware.protect);

// Student xem danh sách khóa học đã đăng ký
router.get('/my-enrollments', enrollmentController.getMyEnrollments);

// Student đăng ký / hủy đăng ký khóa học
router.post('/', permissionMiddleware.requirePermission('enroll_course'), enrollmentController.enrollCourse);
router.delete('/:courseId', permissionMiddleware.requirePermission('enroll_course'), enrollmentController.unenrollCourse);

module.exports = router;
