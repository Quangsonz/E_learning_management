const express = require('express');
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const lessonRoutes = require('./lesson.routes');

const router = express.Router();

// Tích hợp Nested Route cho bài giảng: GET /api/courses/:courseId/lessons
router.use('/:courseId/lessons', lessonRoutes);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Lấy danh sách khóa học (Public - chỉ Published)
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [published, draft]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *   post:
 *     summary: Tạo khóa học mới (Teacher/Admin)
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseRequest'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Tiêu đề đã tồn tại
 */
router.get('/', authMiddleware.optionalProtect, courseController.getAllCourses);

/**
 * @swagger
 * /courses/my-courses:
 *   get:
 *     summary: Lấy danh sách khóa học của tôi (Teacher/Admin)
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/my-courses', authMiddleware.protect, requireRole('teacher', 'admin'), courseController.getAllCourses);

router.get('/:id', authMiddleware.optionalProtect, courseController.getCourse);

router.use(authMiddleware.protect);



router.use(requireRole('admin', 'teacher'));

router.post('/', requirePermission('create_course'), courseController.createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Lấy chi tiết 1 khóa học
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                     course:
 *                       $ref: '#/components/schemas/Course'
 *       404:
 *         description: Không tìm thấy khóa học
 *   patch:
 *     summary: Cập nhật khóa học (Teacher sở hữu / Admin)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền sửa khóa học của người khác
 *   delete:
 *     summary: Xóa khóa học (Teacher sở hữu / Admin)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Xóa thành công
 */
router
  .route('/:id')
  .patch(requirePermission('edit_own_course'), courseController.updateCourse)
  .delete(requirePermission('delete_own_course'), courseController.deleteCourse);

module.exports = router;
