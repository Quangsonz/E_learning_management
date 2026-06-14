const express = require('express');
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole, requirePermission } = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// Hỗ trợ mergeParams cho các nested route từ course nếu cần
const router = express.Router({ mergeParams: true });

router.use(authMiddleware.protect);

// ==========================================
// STUDENT API: LÀM BÀI TEST & NỘP BÀI
// ==========================================
// Lấy nội dung câu hỏi (Đã được lọc che đáp án)
router.get('/:quizId/take', quizController.getQuizForTake);

// Nộp bài thi (Auto Grading)
router.post('/:quizId/submit', permissionMiddleware.requirePermission('submit_quiz'), quizController.submitQuiz);

// ==========================================
// TEACHER & ADMIN API: QUẢN LÝ QUIZ
// ==========================================
router.use(requireRole('admin', 'teacher'));

// Tạo Quiz (Cần mount từ Course Route: POST /courses/:courseId/quizzes)
router.post('/', permissionMiddleware.requirePermission('create_quiz'), quizController.createQuiz);

// Thêm câu hỏi vào Quiz
router.post('/:quizId/questions', permissionMiddleware.requirePermission('create_quiz'), quizController.addQuestion);

module.exports = router;
