const express = require('express');
const progressController = require('../controllers/progress.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * /progress/statistics:
 *   get:
 *     summary: Lấy thống kê học tập tổng quan
 *     tags: [Progress]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalEnrolled:
 *                           type: integer
 *                           example: 5
 *                         completedCourses:
 *                           type: integer
 *                           example: 2
 *                         ongoingCourses:
 *                           type: integer
 *                           example: 3
 *                         details:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Progress'
 */
router.get('/statistics', progressController.getLearningStatistics);

/**
 * @swagger
 * /progress/{courseId}:
 *   get:
 *     summary: Lấy tiến độ học tập của một khóa học cụ thể
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       $ref: '#/components/schemas/Progress'
 */
router.get('/:courseId', progressController.getCourseProgress);

/**
 * @swagger
 * /progress/{courseId}/lessons/{lessonId}/complete:
 *   post:
 *     summary: Đánh dấu bài giảng đã hoàn thành (tự động tính %)
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật tiến độ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       $ref: '#/components/schemas/Progress'
 */
router.post('/:courseId/lessons/:lessonId/complete', progressController.markComplete);

module.exports = router;
