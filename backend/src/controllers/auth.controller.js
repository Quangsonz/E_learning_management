const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: Nguyễn Văn A
 *         email:
 *           type: string
 *           format: email
 *           example: nguyenvana@gmail.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: password123
 *         role:
 *           type: string
 *           enum: [student, teacher]
 *           example: student
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: nguyenvana@gmail.com
 *         password:
 *           type: string
 *           format: password
 *           example: password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         token:
 *           type: string
 *           description: JWT access token
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [student, teacher, admin]
 *         avatar:
 *           type: string
 *         isVerified:
 *           type: boolean
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         message:
 *           type: string
 */

class AuthController {
  /**
   * POST /api/auth/register
   * Đăng ký tài khoản mới
   */
  register = catchAsync(async (req, res, next) => {
    await authService.register(req.body, req, res);
  });

  /**
   * POST /api/auth/login
   * Đăng nhập, trả về JWT token
   */
  login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    await authService.login(email, password, res);
  });

  /**
   * POST /api/auth/logout
   * Đăng xuất (client xóa token)
   */
  logout = catchAsync(async (req, res, next) => {
    await authService.logout(res);
  });

  /**
   * POST /api/auth/forgot-password
   * Gửi email link đặt lại mật khẩu
   */
  forgotPassword = catchAsync(async (req, res, next) => {
    await authService.forgotPassword(req.body.email, req);
    res.status(200).json({
      status: 'success',
      message: 'Link đặt lại mật khẩu đã được gửi qua email!',
    });
  });

  /**
   * PATCH /api/auth/reset-password/:token
   * Đặt lại mật khẩu bằng token từ email
   */
  resetPassword = catchAsync(async (req, res, next) => {
    await authService.resetPassword(req.params.token, req.body.password, res);
  });

  /**
   * GET /api/auth/verify-email/:token
   * Xác minh địa chỉ email
   */
  verifyEmail = catchAsync(async (req, res, next) => {
    await authService.verifyEmail(req.params.token, res);
  });
}

module.exports = new AuthController();
