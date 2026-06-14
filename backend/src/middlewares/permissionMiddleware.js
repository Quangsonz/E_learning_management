const AppError = require('../utils/appError');

// Bảng phân quyền chi tiết cho từng Role (RBAC)
const rolePermissions = {
  admin: [
    'manage_all',
    'manage_users',
    'manage_categories',
    'approve_courses',
    'view_statistics'
  ],
  teacher: [
    'create_course',
    'edit_own_course',
    'delete_own_course',
    'manage_lessons',
    'create_quiz',
    'view_teacher_stats',
    'view_students' // Quyền mới cho phép Teacher xem danh sách học viên
  ],
  student: [
    'enroll_course',
    'view_enrolled_course',
    'submit_quiz',
    'review_course',
    'view_own_progress'
  ]
};

/**
 * Middleware kiểm tra Permission cụ thể
 * @param {String} requiredPermission - Quyền cần thiết để thực hiện action
 */
exports.requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Vui lòng đăng nhập để tiếp tục!', 401));
    }

    const userRole = req.user.role;
    const permissions = rolePermissions[userRole] || [];

    // Cấp quyền tuyệt đối cho admin với cờ 'manage_all'
    if (permissions.includes('manage_all') || permissions.includes(requiredPermission)) {
      return next();
    }

    return next(new AppError(`Truy cập bị từ chối! Bạn thiếu quyền: ${requiredPermission}`, 403));
  };
};

exports.rolePermissions = rolePermissions;
