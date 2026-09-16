const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const validate = require('../middlewares/validate.middleware');
const lessonValidation = require('../validations/lesson.validation');

// mergeParams: true giúp nhận được params từ nested route (VD: /courses/:courseId/lessons)
const router = express.Router({ mergeParams: true });

// Học viên/khách có thể xem danh sách bài giảng (để render Curriculum)
router.get('/', authMiddleware.optionalProtect, lessonController.getLessons);
router.get('/:id', validate(lessonValidation.getLesson), authMiddleware.optionalProtect, lessonController.getLesson);

router.use(authMiddleware.protect);

// Chỉ Teacher và Admin mới được thao tác thêm, sửa, xóa bài giảng
router.use(requireRole('admin', 'teacher'));

router.post('/', requirePermission('manage_lessons'), validate(lessonValidation.createLesson), lessonController.createLesson);

// Route for reordering lessons
router.patch('/reorder', requirePermission('manage_lessons'), validate(lessonValidation.reorderLessons), lessonController.reorderLessons);

router
  .route('/:id')
  .patch(requirePermission('manage_lessons'), validate(lessonValidation.updateLesson), lessonController.updateLesson)
  .delete(requirePermission('manage_lessons'), validate(lessonValidation.getLesson), lessonController.deleteLesson);

module.exports = router;
