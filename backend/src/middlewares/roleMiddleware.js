const AppError = require('../utils/appError');

/**
 * Middleware kiểm tra Role của người dùng
 * Sử dụng sau middleware protect (đã có req.user)
 * @param  {...String} roles - Danh sách các role được phép truy cập
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Vui lòng đăng nhập để tiếp tục!', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không đủ thẩm quyền (Role) để truy cập tài nguyên này!', 403));
    }

    next();
  };
};
