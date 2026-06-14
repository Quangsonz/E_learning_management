const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * /enrollments/my-enrollments:
 *   get:
 *     summary: Lấy danh sách khóa học tôi đã đăng ký
 *     tags: [Enrollments]
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
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 */
router.get('/my-enrollments', enrollmentController.getMyEnrollments);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Đăng ký khóa học
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: 60d0fe4f5311236168a109ca
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Đã đăng ký khóa học này rồi
 */
router.post('/', permissionMiddleware.requirePermission('enroll_course'), enrollmentController.enrollCourse);

/**
 * @swagger
 * /enrollments/{courseId}:
 *   delete:
 *     summary: Hủy đăng ký khóa học
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khóa học cần hủy đăng ký
 *     responses:
 *       204:
 *         description: Hủy đăng ký thành công
 *       400:
 *         description: Chưa đăng ký khóa học này
 */
router.delete('/:courseId', permissionMiddleware.requirePermission('enroll_course'), enrollmentController.unenrollCourse);

module.exports = router;
