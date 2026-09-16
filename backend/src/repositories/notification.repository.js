const BaseRepository = require('./base.repository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  // Lấy danh sách thông báo theo ID người nhận (tối ưu lean + index)
  async findByRecipient(userId, limit = 50) {
    return await this.model.find({ recipient: userId }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  // Lấy các thông báo chưa đọc
  async countUnread(userId) {
    return await this.model.countDocuments({ recipient: userId, isRead: false });
  }
}

module.exports = new NotificationRepository();
