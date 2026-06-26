const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');

/**
 * Middleware bảo vệ route - xác thực JWT token
 * Tên alias: protect | verifyToken (để tương thích với nhiều cách gọi)
 * 
 * Gắn req.user nếu token hợp lệ
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Lấy token từ Authorization header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập!', 401));
  }

  // 2) Xác thực token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token đã hết hạn. Vui lòng đăng nhập lại!', 401));
    }
    return next(new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401));
  }

  // 3) Kiểm tra user có còn tồn tại không
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('Tài khoản sở hữu token này không còn tồn tại.', 401));
  }

  // Cấp quyền truy cập, gắn thông tin user vào request
  req.user = currentUser;
  next();
});

/**
 * Middleware tùy chọn - nếu có token thì gắn req.user, không có thì next() luôn
 */
exports.optionalProtect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (currentUser) {
      req.user = currentUser;
    }
  } catch (err) {
    // Ignore error, just treat as guest
  }

  next();
});

/**
 * Alias của protect - dùng tên verifyToken cho tương thích đặc tả bài
 */
exports.verifyToken = exports.protect;

/**
 * Middleware kiểm tra quyền theo role (flexible)
 * Sử dụng sau protect
 * @param  {...string} roles - Danh sách các role được phép
 * @example router.delete('/:id', protect, restrictTo('admin'), deleteUser)
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này!', 403));
    }
    next();
  };
};

/**
 * Middleware chỉ cho Admin truy cập
 * Sử dụng sau protect
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Vui lòng đăng nhập!', 401));
  }
  if (req.user.role !== 'admin') {
    return next(new AppError('Chỉ Admin mới có quyền truy cập tài nguyên này!', 403));
  }
  next();
};

/**
 * Middleware chỉ cho Teacher và Admin truy cập
 * Sử dụng sau protect
 */
exports.isTeacher = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Vui lòng đăng nhập!', 401));
  }
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return next(new AppError('Chỉ Giảng viên hoặc Admin mới có quyền truy cập tài nguyên này!', 403));
  }
  next();
};
