const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware.protect);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Lấy danh sách thông báo và số thông báo chưa đọc
 *     tags: [Notifications]
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     unreadCount:
 *                       type: integer
 *                       example: 3
 *
 * /notifications/mark-all-read:
 *   patch:
 *     summary: Đánh dấu tất cả thông báo là đã đọc
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Thành công
 *
 * /notifications/{id}/read:
 *   patch:
 *     summary: Đánh dấu một thông báo là đã đọc
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get('/', notificationController.getMyNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
