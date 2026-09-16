class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode || this.deriveErrorCode(statusCode, message);
    this.isOperational = true; // Identify operational errors vs programming bugs

    Error.captureStackTrace(this, this.constructor);
  }

  deriveErrorCode(statusCode, message) {
    const msg = (message || '').toLowerCase();
    if (statusCode === 401) {
      if (msg.includes('hết hạn') || msg.includes('expired')) return 'TOKEN_EXPIRED';
      if (msg.includes('không tồn tại') || msg.includes('not exist') || msg.includes('not found')) return 'ACCOUNT_NOT_FOUND';
      return 'UNAUTHORIZED';
    }
    if (statusCode === 403) {
      if (msg.includes('tạm ngưng') || msg.includes('suspended')) return 'ACCOUNT_SUSPENDED';
      if (msg.includes('admin')) return 'ADMIN_REQUIRED';
      if (msg.includes('giảng viên') || msg.includes('teacher')) return 'TEACHER_REQUIRED';
      return 'FORBIDDEN';
    }
    if (statusCode === 404) {
      if (msg.includes('khóa học') || msg.includes('course')) return 'COURSE_NOT_FOUND';
      if (msg.includes('bài học') || msg.includes('lesson')) return 'LESSON_NOT_FOUND';
      if (msg.includes('danh mục') || msg.includes('category')) return 'CATEGORY_NOT_FOUND';
      if (msg.includes('quiz') || msg.includes('bài kiểm tra')) return 'QUIZ_NOT_FOUND';
      if (msg.includes('đơn ứng tuyển') || msg.includes('application')) return 'APPLICATION_NOT_FOUND';
      if (msg.includes('yêu cầu rút tiền') || msg.includes('payout')) return 'PAYOUT_NOT_FOUND';
      if (msg.includes('người dùng') || msg.includes('user')) return 'USER_NOT_FOUND';
      return 'RESOURCE_NOT_FOUND';
    }
    if (statusCode === 400) {
      if (msg.includes('mật khẩu') || msg.includes('password')) return 'INVALID_PASSWORD';
      if (msg.includes('email')) return 'INVALID_EMAIL';
      if (msg.includes('upload') || msg.includes('file') || msg.includes('tệp')) return 'INVALID_FILE';
      if (msg.includes('đầy đủ') || msg.includes('required') || msg.includes('thiếu')) return 'MISSING_REQUIRED_FIELDS';
      return 'BAD_REQUEST';
    }
    if (statusCode === 409) return 'CONFLICT';
    if (statusCode >= 500) return 'INTERNAL_SERVER_ERROR';
    return 'OPERATION_ERROR';
  }
}

module.exports = AppError;
