const express = require('express');
const quizController = require('../controllers/quiz.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.protect);

/**
 * @swagger
 * /quizzes/{quizId}/take:
 *   get:
 *     summary: Lấy đề bài (Đáp án đúng được ẩn hoàn toàn)
 *     tags: [Quiz]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *
 * /quizzes/{quizId}/submit:
 *   post:
 *     summary: Nộp bài và nhận điểm tự động
 *     tags: [Quiz]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizSubmitRequest'
 *     responses:
 *       200:
 *         description: Kết quả chấm điểm
 *
 * /quizzes:
 *   post:
 *     summary: Tạo Quiz mới (Teacher/Admin)
 *     tags: [Quiz]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuizRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *
 * /quizzes/{quizId}/questions:
 *   post:
 *     summary: Thêm câu hỏi vào Quiz (Teacher/Admin)
 *     tags: [Quiz]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               points:
 *                 type: number
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Thêm câu hỏi thành công
 */
router.get('/:quizId/take', quizController.getQuizForTake);
router.post('/:quizId/submit', quizController.submitQuiz);

// Smart Quiz Routes
router.get('/courses/:courseId/smart-quiz/generate', quizController.generateSmartQuiz);
router.post('/courses/:courseId/smart-quiz/submit', quizController.submitSmartQuiz);

router.use(requireRole('admin', 'teacher'));
router.post('/', permissionMiddleware.requirePermission('create_quiz'), quizController.createQuiz);
router.post('/:quizId/questions', permissionMiddleware.requirePermission('create_quiz'), quizController.addQuestion);
router.get('/:quizId/questions', quizController.getQuestionsForTeacher);

router.route('/:id')
  .patch(permissionMiddleware.requirePermission('create_quiz'), quizController.updateQuiz)
  .delete(permissionMiddleware.requirePermission('create_quiz'), quizController.deleteQuiz);

router.route('/questions/:id')
  .patch(permissionMiddleware.requirePermission('create_quiz'), quizController.updateQuestion)
  .delete(permissionMiddleware.requirePermission('create_quiz'), quizController.deleteQuestion);

// Lesson Question routes
router.get('/lessons/:lessonId/questions', quizController.getLessonQuestionsForTeacher);
router.post('/lessons/:lessonId/questions', permissionMiddleware.requirePermission('create_quiz'), quizController.addLessonQuestion);

module.exports = router;
