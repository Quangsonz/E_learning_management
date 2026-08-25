const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Xóa password trước khi trả về
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

class AuthService {
  /**
   * Đăng ký người dùng mới
   * @param {Object} userData - { name, email, password, role }
   * @param {Object} req - Express request object (dùng để lấy host URL)
   * @param {Object} res - Express response object
   */
  async register(userData, req, res) {
    const { name, email, password, role } = userData;

    // Kiểm tra email đã tồn tại
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng!', 400);
    }

    // Chỉ cho phép role: student | teacher (không cho client tự đặt admin)
    const allowedRoles = ['student', 'teacher'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    const newUser = await userRepository.create({ name, email, password, role: assignedRole });

    // Cấu hình email verification (bỏ qua lỗi gửi mail, không block đăng ký)
    const verifyToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    const protocol = req.protocol || 'http';
    const host = req.get ? req.get('host') : 'localhost:5000';
    const verifyURL = `${protocol}://${host}/api/auth/verify-email/${verifyToken}`;
    const message = `Chào ${name},\n\nVui lòng click vào link sau để xác minh email của bạn:\n${verifyURL}\n\nLink có hiệu lực trong 24 giờ.`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Xác minh địa chỉ Email - E-Learning',
        message,
      });
    } catch (error) {
      // Lỗi gửi mail không block đăng ký, chỉ log lỗi
      newUser.verificationToken = undefined;
      await newUser.save({ validateBeforeSave: false });
      console.error('[AuthService] Gửi email xác thực thất bại:', error.message);
    }

    createSendToken(newUser, 201, res);
  }

  /**
   * Đăng nhập
   * @param {string} email
   * @param {string} password
   * @param {Object} res
   */
  async login(email, password, res) {
    if (!email || !password) {
      throw new AppError('Vui lòng cung cấp email và password!', 400);
    }

    // findByEmail đã có .select('+password') trong user.repository
    const user = await userRepository.findByEmail(email);

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    createSendToken(user, 200, res);
  }

  /**
   * Quên mật khẩu - Gửi link reset
   * @param {string} email
   * @param {Object} req
   */
  async forgotPassword(email, req) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng nào với địa chỉ email này', 404);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetURL = `${frontendUrl}/reset-password?token=${resetToken}`;
    const message = `Bạn đã yêu cầu đặt lại mật khẩu.\n\nClick vào link bên dưới để đặt lại (có hiệu lực trong 10 phút):\n${resetURL}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Đặt lại mật khẩu (có hiệu lực trong 10 phút)',
        message,
      });
    } catch (err) {
      console.error('[AuthService] Forgot password email error:', err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError(`Đã có lỗi xảy ra khi gửi email: ${err.message}`, 500);
    }
  }

  /**
   * Đặt lại mật khẩu bằng token
   * @param {string} token - raw token từ URL
   * @param {string} newPassword
   * @param {Object} res
   */
  async resetPassword(token, newPassword, res) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn!', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  }

  /**
   * Xác minh email
   * @param {string} token - raw token từ URL
   * @param {Object} res
   */
  async verifyEmail(token, res) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findOne({ verificationToken: hashedToken });

    if (!user) {
      throw new AppError('Token xác minh không hợp lệ!', 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email đã được xác minh thành công! Bạn có thể đăng nhập ngay bây giờ.',
    });
  }

  /**
   * Đăng xuất (vô hiệu hóa token phía client, server trả 200)
   * Nếu muốn blacklist token thực sự, cần Redis/DB store.
   * @param {Object} res
   */
  async logout(res) {
    res.status(200).json({
      status: 'success',
      message: 'Đăng xuất thành công!',
    });
  }
}

module.exports = new AuthService();
