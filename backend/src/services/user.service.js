const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');

class UserService {
  /**
   * Lấy tất cả user với filter query
   * @param {Object} query - Mongoose filter query
   */
  async getAllUsers(query) {
    // Tách các params không phải filter
    const { page, limit, sort, fields, ...filter } = query;
    return await userRepository.find(filter);
  }

  /**
   * Lấy user theo ID
   * @param {string} id - User ID
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng với ID này', 404);
    }
    return user;
  }

  /**
   * Tạo user mới (Admin)
   * @param {Object} userData - { name, email, password, role }
   */
  async createUser(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng', 400);
    }
    return await userRepository.create(userData);
  }

  /**
   * Cập nhật thông tin user
   * @param {string} id - User ID
   * @param {Object} updateData - Dữ liệu cập nhật
   */
  async updateUser(id, updateData) {
    const user = await userRepository.updateById(id, updateData);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng với ID này', 404);
    }
    return user;
  }

  /**
   * Thay đổi mật khẩu (yêu cầu xác thực mật khẩu cũ)
   * @param {string} id - User ID
   * @param {string} currentPassword - Mật khẩu hiện tại
   * @param {string} newPassword - Mật khẩu mới
   */
  async changePassword(id, currentPassword, newPassword) {
    // Phải select +password vì field này bị ẩn mặc định
    const user = await userRepository.findByIdWithPassword(id);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Kiểm tra mật khẩu cũ
    const isCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isCorrect) {
      throw new AppError('Mật khẩu hiện tại không chính xác!', 401);
    }

    // Cập nhật mật khẩu mới (sẽ tự động hash qua pre-save hook)
    user.password = newPassword;
    await user.save();

    return user;
  }

  /**
   * Xóa user
   * @param {string} id - User ID
   */
  async deleteUser(id) {
    const user = await userRepository.deleteById(id);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng với ID này', 404);
    }
    return user;
  }
}

module.exports = new UserService();
