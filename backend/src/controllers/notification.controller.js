const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');

class NotificationController {
  getMyNotifications = catchAsync(async (req, res, next) => {
    const data = await notificationService.getMyNotifications(req.user.id);

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  markAsRead = catchAsync(async (req, res, next) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    });
  });

  markAllAsRead = catchAsync(async (req, res, next) => {
    await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Tất cả thông báo đã được đánh dấu là đã đọc'
    });
  });
}

module.exports = new NotificationController();
