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
  // Gắn param ID bằng ID của user đang login
  getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
  };

  // Cập nhật Profile của chính mình (Student, Teacher, Admin)
  updateMe = catchAsync(async (req, res, next) => {
    // 1) Không cho phép update password ở route này
    if (req.body.password) {
      return next(new AppError('Không thể cập nhật mật khẩu ở đường dẫn này.', 400));
    }

    // 2) Chỉ cho phép update các trường cơ bản (ngăn chặn hack đổi role)
    const filteredBody = filterObj(req.body, 'name', 'avatar');

    // 3) Thực hiện cập nhật
    const updatedUser = await userService.updateUser(req.user.id, filteredBody);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  });

  // Lấy danh sách user (Cho Admin & Teacher)
  getAllUsers = catchAsync(async (req, res, next) => {
    let query = { ...req.query };

    // Nếu là teacher đang xem, chỉ trả về những user có role = 'student'
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

  // Lấy thông tin 1 user bất kỳ (dùng chung cho getMe và Admin get)
  getUser = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  });

  // Tạo User (Admin)
  createUser = catchAsync(async (req, res, next) => {
    const newUser = await userService.createUser(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  });

  // Update toàn diện User (Admin) - Được phép thay đổi cả role
  updateUser = catchAsync(async (req, res, next) => {
    const updatedUser = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  });

  // Xóa User (Admin)
  deleteUser = catchAsync(async (req, res, next) => {
    await userService.deleteUser(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

module.exports = new UserController();
