const BaseRepository = require('./base.repository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  // Lấy danh sách thông báo theo ID người nhận
  async findByRecipient(userId) {
    return await this.model.find({ recipient: userId }).sort({ createdAt: -1 });
  }

  // Lấy các thông báo chưa đọc
  async countUnread(userId) {
    return await this.model.countDocuments({ recipient: userId, isRead: false });
  }
}

module.exports = new NotificationRepository();
