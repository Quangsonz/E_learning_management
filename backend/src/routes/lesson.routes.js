const express = require('express');
const lessonController = require('../controllers/lesson.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

// mergeParams: true giúp nhận được params từ nested route (VD: /courses/:courseId/lessons)
const router = express.Router({ mergeParams: true });

router.use(authMiddleware.protect);

// Học viên có thể xem danh sách bài giảng (Chặn access video ở cấp thấp hơn hoặc Font-end)
router.get('/', lessonController.getLessons);
router.get('/:id', lessonController.getLesson);

// Chỉ Teacher và Admin mới được thao tác thêm, sửa, xóa bài giảng
router.use(requireRole('admin', 'teacher'));

router.post('/', requirePermission('manage_lessons'), lessonController.createLesson);

router
  .route('/:id')
  .patch(requirePermission('manage_lessons'), lessonController.updateLesson)
  .delete(requirePermission('manage_lessons'), lessonController.deleteLesson);

module.exports = router;
