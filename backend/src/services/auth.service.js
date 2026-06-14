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
  async register(userData, reqUrl, res) {
    const { name, email, password, role } = userData;
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng!', 400);
    }

    const newUser = await userRepository.create({ name, email, password, role });

    // Cấu hình email verification
    const verifyToken = newUser.createEmailVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    const verifyURL = `${reqUrl.protocol}://${reqUrl.get('host')}/api/auth/verify-email/${verifyToken}`;
    const message = `Chào ${name},\n\nVui lòng click vào link sau để xác minh email của bạn: \n${verifyURL}`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Xác minh địa chỉ Email',
        message,
      });
    } catch (error) {
      newUser.verificationToken = undefined;
      await newUser.save({ validateBeforeSave: false });
      console.error(error);
    }

    createSendToken(newUser, 201, res);
  }

  async login(email, password, res) {
    if (!email || !password) {
      throw new AppError('Vui lòng cung cấp email và password!', 400);
    }

    // Include password field to compare
    const user = await userRepository.findByEmail(email);

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Email hoặc mật khẩu không chính xác', 401);
    }

    createSendToken(user, 200, res);
  }

  async forgotPassword(email, reqUrl) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Không tìm thấy người dùng nào với địa chỉ email này', 404);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${reqUrl.protocol}://${reqUrl.get('host')}/api/auth/reset-password/${resetToken}`;
    const message = `Bạn đã yêu cầu đặt lại mật khẩu. Gửi một yêu cầu PATCH tới: \n${resetURL}\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Đặt lại mật khẩu của bạn (có hiệu lực trong 10 phút)',
        message,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new AppError('Đã có lỗi xảy ra khi gửi email. Thử lại sau!', 500);
    }
  }

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

  async verifyEmail(token, res) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findOne({ verificationToken: hashedToken });

    if (!user) {
      throw new AppError('Token không hợp lệ!', 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email đã được xác minh thành công!',
    });
  }
}

module.exports = new AuthService();
