const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Bắt buộc phải đăng nhập để xem/sửa thông báo của mình
router.use(authMiddleware.protect);

router.get('/', notificationController.getMyNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
