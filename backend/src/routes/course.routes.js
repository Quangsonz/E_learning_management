const express = require('express');
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const lessonRoutes = require('./lesson.routes');

const router = express.Router();

// Tích hợp Nested Route cho bài giảng: GET /api/courses/:courseId/lessons
router.use('/:courseId/lessons', lessonRoutes);

// ==========================================
// PUBLIC API (Mọi người đều có thể xem khóa học Published)
// ==========================================
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);

// ==========================================
// BẢO VỆ API BÊN DƯỚI (Yêu cầu đăng nhập)
// ==========================================
router.use(authMiddleware.protect);

// Học viên / Giảng viên lấy danh sách khóa học do mình tạo ra
router.get('/my-courses', requireRole('teacher', 'admin'), courseController.getAllCourses);

// ==========================================
// API CREATE / UPDATE / DELETE (Teacher & Admin)
// ==========================================
// Bắt buộc role là teacher hoặc admin
router.use(requireRole('admin', 'teacher'));

// Phân quyền chi tiết cho action tạo khóa học
router.post('/', requirePermission('create_course'), courseController.createCourse);

// Phân quyền sửa/xóa (Sẽ được logic trong Service kiểm tra thêm quyền sở hữu)
router
  .route('/:id')
  .patch(requirePermission('edit_own_course'), courseController.updateCourse)
  .delete(requirePermission('delete_own_course'), courseController.deleteCourse);

module.exports = router;
