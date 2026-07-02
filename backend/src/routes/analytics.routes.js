const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * /analytics/admin:
 *   get:
 *     summary: Dashboard thống kê toàn hệ thống (Admin only)
 *     tags: [Analytics]
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalCourses:
 *                           type: integer
 *                         totalEnrollments:
 *                           type: integer
 *                         totalRevenue:
 *                           type: number
 *                     revenueByMonth:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                           enrollments:
 *                             type: integer
 *                     topCourses:
 *                       type: array
 *                       items:
 *                         type: object
 *
 * /analytics/teacher:
 *   get:
 *     summary: Dashboard thống kê cho Giảng viên
 *     tags: [Analytics]
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalCourses:
 *                           type: integer
 *                         totalStudents:
 *                           type: integer
 *                         totalRevenue:
 *                           type: number
 *                         completionCount:
 *                           type: integer
 *                     courseStats:
 *                       type: array
 *                     monthlyEnrollments:
 *                       type: array
 *                     quizResults:
 *                       type: array
 */
router.get('/admin', requireRole('admin'), requirePermission('view_statistics'), analyticsController.getAdminDashboard);
router.get('/teacher', requireRole('admin', 'teacher'), analyticsController.getTeacherDashboard);
router.get('/system-health', requireRole('admin'), analyticsController.getSystemHealth);
router.get('/export-pdf', requireRole('admin'), analyticsController.exportFinancialReportPDF);

/**
 * @swagger
 * /analytics/orders:
 *   get:
 *     summary: Lấy danh sách Orders và revenue summary (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách orders + summary
 */
router.get('/orders', requireRole('admin'), requirePermission('view_statistics'), analyticsController.getOrderStats);

module.exports = router;
