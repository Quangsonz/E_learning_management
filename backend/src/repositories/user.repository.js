const BaseRepository = require('./base.repository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Tìm user theo email, bao gồm field password (dùng cho auth)
   * @param {string} email
   */
  async findByEmail(email) {
    return await this.model.findOne({ email }).select('+password');
  }

  /**
   * Tìm user theo ID, bao gồm field password (dùng khi cần verify mật khẩu cũ)
   * @param {string} id
   */
  async findByIdWithPassword(id) {
    return await this.model.findById(id).select('+password');
  }

  /**
   * Lấy danh sách leaderboard dựa trên xp
   * @param {number} limit 
   */
  async getTopUsersByXP(limit = 20) {
    return await this.model
      .find({ role: 'student', xp: { $gt: 0 } })
      .sort({ xp: -1 })
      .limit(limit)
      .select('name avatar xp studyStreakDays');
  }
}

module.exports = new UserRepository();
