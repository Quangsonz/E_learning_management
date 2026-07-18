const express = require('express');
const assignmentController = require('../controllers/assignment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Tất cả các routes liên quan đến bài tập yêu cầu đã đăng nhập
router.use(authMiddleware.protect);

// Lấy danh sách hoặc tạo bài tập mới theo khóa học
router.route('/course/:courseId')
  .post(requireRole('admin', 'teacher'), assignmentController.createAssignment)
  .get(assignmentController.getAssignments);

// Lấy chi tiết bài tập cụ thể
router.route('/:id')
  .get(assignmentController.getAssignmentById);

// Nộp bài tập (Dành cho học viên) hoặc xem danh sách bài đã nộp (Dành cho giáo viên/admin)
router.route('/:assignmentId/submissions')
  .get(requireRole('admin', 'teacher'), assignmentController.getSubmissions);

router.get('/:assignmentId/my-submission', requireRole('student'), assignmentController.getMySubmission);
router.post('/:assignmentId/submit', requireRole('student'), assignmentController.submitAssignment);

// Chấm điểm bài tập đã nộp
router.patch('/submissions/:submissionId/grade', requireRole('admin', 'teacher'), assignmentController.gradeSubmission);

module.exports = router;
