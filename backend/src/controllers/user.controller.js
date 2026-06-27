const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Tiện ích lọc các trường cho phép update
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

class UserController {
  /**
   * GET /api/users/leaderboard
   * Lấy danh sách Leaderboard
   */
  getLeaderboard = catchAsync(async (req, res, next) => {
    const userRepository = require('../repositories/user.repository');
    const limit = parseInt(req.query.limit) || 20;
    const topUsers = await userRepository.getTopUsersByXP(limit);

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: topUsers
      }
    });
  });

  /**
   * GET /api/users/wishlist
   * Lấy danh sách khóa học trong wishlist của user
   */
  getWishlist = catchAsync(async (req, res, next) => {
    const userRepository = require('../repositories/user.repository');
    // fetch user and populate wishlist
    const user = await userRepository.findById(req.user.id);
    if (user) {
      await user.populate({
        path: 'wishlist',
        select: '-__v'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        wishlist: user.wishlist || []
      }
    });
  });

  /**
   * POST /api/users/wishlist
   * Toggle khóa học vào/ra khỏi wishlist
   */
  toggleWishlist = catchAsync(async (req, res, next) => {
    const userRepository = require('../repositories/user.repository');
    const { courseId } = req.body;
    
    if (!courseId) {
      return next(new AppError('Vui lòng cung cấp ID khóa học', 400));
    }

    const user = await userRepository.findById(req.user.id);
    let wishlist = user.wishlist || [];
    
    const index = wishlist.indexOf(courseId);
    let isAdded = false;

    if (index > -1) {
      // Đã có thì xóa đi
      wishlist.splice(index, 1);
    } else {
      // Chưa có thì thêm vào
      wishlist.push(courseId);
      isAdded = true;
    }

    user.wishlist = wishlist;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: isAdded ? 'Đã thêm khóa học vào wishlist' : 'Đã gỡ khóa học khỏi wishlist',
      data: {
        wishlist: user.wishlist,
        isAdded
      }
    });
  });
  /**
   * GET /api/users/me
   * Gắn param ID bằng ID của user đang login, sau đó gọi getUser
   */
  getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
  };

  /**
   * PATCH /api/users/updateMe
   * Cập nhật Profile của chính mình (Student, Teacher, Admin)
   * Chỉ cho phép cập nhật: name, avatar
   */
  updateMe = catchAsync(async (req, res, next) => {
    // Không cho phép update password ở route này
    if (req.body.password) {
      return next(new AppError('Không thể cập nhật mật khẩu ở đường dẫn này. Sử dụng /users/changePassword.', 400));
    }

    // Chỉ cho phép update các trường cơ bản (ngăn chặn hack đổi role)
    const filteredBody = filterObj(req.body, 'name', 'avatar');

    const updatedUser = await userService.updateUser(req.user.id, filteredBody);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  });

  /**
   * PATCH /api/users/changePassword
   * Thay đổi mật khẩu (yêu cầu cung cấp mật khẩu cũ)
   */
  changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới!', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Mật khẩu mới phải có ít nhất 6 ký tự!', 400));
    }

    await userService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      status: 'success',
      message: 'Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập lại.',
    });
  });

  /**
   * GET /api/users
   * Lấy danh sách user (Admin & Teacher)
   */
  getAllUsers = catchAsync(async (req, res, next) => {
    let query = { ...req.query };

    // Nếu là teacher, chỉ được xem student
    if (req.user.role === 'teacher') {
      query.role = 'student';
    }

    const users = await userService.getAllUsers(query);

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  });

  /**
   * GET /api/users/:id
   * Lấy thông tin 1 user (dùng chung cho getMe và Admin get)
   */
  getUser = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  /**
   * POST /api/users
   * Tạo User mới (Admin only)
   */
  createUser = catchAsync(async (req, res, next) => {
    const newUser = await userService.createUser(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  });

  /**
   * PATCH /api/users/:id
   * Update toàn diện User (Admin) - có thể thay đổi role
   */
  updateUser = catchAsync(async (req, res, next) => {
    // Admin không được update password qua route này
    if (req.body.password) {
      delete req.body.password;
    }

    const updatedUser = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  });

  /**
   * DELETE /api/users/:id
   * Xóa User (Admin only)
   */
  deleteUser = catchAsync(async (req, res, next) => {
    await userService.deleteUser(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

module.exports = new UserController();
