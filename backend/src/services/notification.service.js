const notificationRepository = require('../repositories/notification.repository');
const socketLayer = require('../socket');
const AppError = require('../utils/appError');

class NotificationService {
  /**
   * Tạo thông báo mới và gửi Socket realtime
   * @param {Object} data - { recipient, title, message, type, link }
   */
  async createNotification(data) {
    // 1. Lưu thông báo vào Database
    const notification = await notificationRepository.create(data);

    // 2. Kích hoạt Socket.IO để gửi realtime tới Client
    socketLayer.sendNotificationToUser(data.recipient, notification);

    return notification;
  }

  async getMyNotifications(userId) {
    const notifications = await notificationRepository.findByRecipient(userId);
    const unreadCount = await notificationRepository.countUnread(userId);

    return { notifications, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    const notification = await notificationRepository.findById(notificationId);
    
    if (!notification) throw new AppError('Không tìm thấy thông báo', 404);
    
    // Đảm bảo chỉ người nhận mới được đánh dấu đọc
    if (notification.recipient.toString() !== userId.toString()) {
      throw new AppError('Bạn không có quyền thao tác trên thông báo này', 403);
    }

    notification.isRead = true;
    return await notification.save();
  }

  async markAllAsRead(userId) {
    // UpdateMany không có trong BaseRepository nên ta gọi trực tiếp model
    await notificationRepository.model.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return true;
  }
}

module.exports = new NotificationService();
