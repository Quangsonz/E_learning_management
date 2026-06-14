const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

class AuthController {
  register = catchAsync(async (req, res, next) => {
    // req.get('host') => localhost:5000 / api.example.com
    await authService.register(req.body, req, res);
  });

  login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    await authService.login(email, password, res);
  });

  forgotPassword = catchAsync(async (req, res, next) => {
    await authService.forgotPassword(req.body.email, req);
    res.status(200).json({
      status: 'success',
      message: 'Token đặt lại mật khẩu đã được gửi qua email!',
    });
  });

  resetPassword = catchAsync(async (req, res, next) => {
    await authService.resetPassword(req.params.token, req.body.password, res);
  });

  verifyEmail = catchAsync(async (req, res, next) => {
    await authService.verifyEmail(req.params.token, res);
  });

  // Có thể phát triển hàm logout / refreshToken tùy nhu cầu thực tế
}

module.exports = new AuthController();
