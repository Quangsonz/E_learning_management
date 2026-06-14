const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Lấy token và check xem token có tồn tại không
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập!', 401));
  }

  // 2) Xác thực token (Verification)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Kiểm tra user có tồn tại không (trong trường hợp user bị xóa sau khi có token)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User sở hữu token này không còn tồn tại.', 401));
  }

  // Cấp quyền truy cập
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này!', 403));
    }
    next();
  };
};
