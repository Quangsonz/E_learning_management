const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

// mergeParams: true giúp nhận được params từ nested route (VD: /courses/:courseId/lessons)
const router = express.Router({ mergeParams: true });

// Học viên/khách có thể xem danh sách bài giảng (để render Curriculum)
router.get('/', authMiddleware.optionalProtect, lessonController.getLessons);
router.get('/:id', authMiddleware.optionalProtect, lessonController.getLesson);

router.use(authMiddleware.protect);

// Chỉ Teacher và Admin mới được thao tác thêm, sửa, xóa bài giảng
router.use(requireRole('admin', 'teacher'));

router.post('/', requirePermission('manage_lessons'), lessonController.createLesson);

// Route for reordering lessons
router.patch('/reorder', requirePermission('manage_lessons'), lessonController.reorderLessons);

router
  .route('/:id')
  .patch(requirePermission('manage_lessons'), lessonController.updateLesson)
  .delete(requirePermission('manage_lessons'), lessonController.deleteLesson);

module.exports = router;
