const AppError = require('../utils/appError');

const ERROR_MESSAGES = {
  TOKEN_EXPIRED: {
    vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!',
    en: 'Session has expired. Please log in again.'
  },
  INVALID_TOKEN: {
    vi: 'Token xác thực không hợp lệ. Vui lòng đăng nhập lại!',
    en: 'Invalid authentication token. Please log in again.'
  },
  UNAUTHORIZED: {
    vi: 'Bạn chưa đăng nhập hoặc không có quyền truy cập.',
    en: 'You are not authorized. Please log in to continue.'
  },
  FORBIDDEN: {
    vi: 'Bạn không có quyền thực hiện hành động này.',
    en: 'You do not have permission to perform this action.'
  },
  ADMIN_REQUIRED: {
    vi: 'Yêu cầu quyền Quản trị viên (Admin).',
    en: 'Administrator permissions required.'
  },
  TEACHER_REQUIRED: {
    vi: 'Yêu cầu quyền Giảng viên hoặc Quản trị viên.',
    en: 'Teacher or Administrator permissions required.'
  },
  ACCOUNT_SUSPENDED: {
    vi: 'Tài khoản của bạn đã bị tạm ngưng. Vui lòng liên hệ hỗ trợ.',
    en: 'Your account has been suspended. Please contact support.'
  },
  COURSE_NOT_FOUND: {
    vi: 'Không tìm thấy khóa học này.',
    en: 'Course not found.'
  },
  LESSON_NOT_FOUND: {
    vi: 'Không tìm thấy bài học này.',
    en: 'Lesson not found.'
  },
  RESOURCE_NOT_FOUND: {
    vi: 'Không tìm thấy tài nguyên được yêu cầu.',
    en: 'Requested resource not found.'
  },
  INVALID_PASSWORD: {
    vi: 'Mật khẩu không chính xác hoặc không đủ điều kiện.',
    en: 'Invalid password provided.'
  },
  INVALID_ID: {
    vi: 'Mã định danh (ID) không hợp lệ.',
    en: 'Invalid identifier (ID) format.'
  },
  DUPLICATE_FIELD: {
    vi: 'Dữ liệu đã tồn tại trong hệ thống. Vui lòng chọn giá trị khác.',
    en: 'Duplicate field value. Please choose another value.'
  },
  VALIDATION_ERROR: {
    vi: 'Dữ liệu nhập vào không hợp lệ.',
    en: 'Invalid input data.'
  },
  PAYLOAD_TOO_LARGE: {
    vi: 'Dung lượng yêu cầu vượt quá giới hạn cho phép.',
    en: 'Payload too large. Request size exceeds the allowable limit.'
  },
  LIMIT_EXCEEDED: {
    vi: 'Số lượng bản ghi yêu cầu không hợp lệ hoặc vượt quá giới hạn cho phép (tối đa 100 bản ghi/trang).',
    en: 'Requested limit exceeds the allowable maximum (maximum 100 items per page).'
  },
  INVALID_PAGE: {
    vi: 'Số trang (page) không hợp lệ (phải là số nguyên dương từ 1 trở lên).',
    en: 'Invalid page number.'
  },
  MALFORMED_JSON: {
    vi: 'Dữ liệu JSON gửi lên sai cú pháp hoặc không hợp lệ.',
    en: 'Malformed JSON payload. Please verify your request body syntax.'
  },
  UNSUPPORTED_MEDIA_TYPE: {
    vi: 'Định dạng Content-Type không được hỗ trợ. Vui lòng sử dụng application/json hoặc multipart/form-data.',
    en: 'Unsupported Media Type. Please use application/json or multipart/form-data.'
  },
  FILE_TOO_LARGE: {
    vi: 'Kích thước tệp tin vượt quá giới hạn cho phép.',
    en: 'Uploaded file size exceeds the allowed limit.'
  },
  TOO_MANY_FILES: {
    vi: 'Số lượng tệp tin tải lên vượt quá giới hạn cho phép.',
    en: 'Too many files uploaded.'
  },
  URI_TOO_LONG: {
    vi: 'Độ dài URL hoặc Query String vượt quá giới hạn cho phép (tối đa 2048 ký tự).',
    en: 'URI Too Long.'
  },
  INTERNAL_SERVER_ERROR: {
    vi: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    en: 'Internal server error. Please try again later.'
  }
};

const resolveMessage = (err, req) => {
  const lang = (req?.headers?.['accept-language'] || 'vi').toLowerCase().startsWith('en') ? 'en' : 'vi';
  if (err.errorCode && ERROR_MESSAGES[err.errorCode]) {
    // If err.message has detailed validation errors, keep it unless default fallback is preferred
    if (err.errorCode === 'VALIDATION_ERROR' && err.message && err.message !== 'Dữ liệu nhập vào không hợp lệ.') {
      return err.message;
    }
    return ERROR_MESSAGES[err.errorCode][lang] || err.message;
  }
  return err.message;
};

const sendErrorDev = (err, req, res) => {
  const responsePayload = {
    status: err.status,
    errorCode: err.errorCode || 'UNKNOWN_ERROR',
    message: resolveMessage(err, req),
    error: err,
    stack: err.stack,
  };
  if (err.details) {
    responsePayload.details = err.details;
  }
  res.status(err.statusCode).json(responsePayload);
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error (status < 500): send message to client
  if (err.isOperational && err.statusCode < 500) {
    const responsePayload = {
      status: err.status,
      errorCode: err.errorCode || 'OPERATION_ERROR',
      message: resolveMessage(err, req),
    };
    if (err.details) {
      responsePayload.details = err.details;
    }
    res.status(err.statusCode).json(responsePayload);
  } 
  // Programming or internal database/server error: don't leak details
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: resolveMessage({ errorCode: 'INTERNAL_SERVER_ERROR', message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.' }, req),
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = err;

  // 1. Handle Body-parser Payload Too Large (413)
  if (err.type === 'entity.too.large' || err.statusCode === 413 || err.status === 413) {
    error = new AppError('Dung lượng yêu cầu vượt quá giới hạn cho phép.', 413, 'PAYLOAD_TOO_LARGE');
  }

  // 2. Handle Malformed JSON SyntaxError from body-parser
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Dữ liệu JSON gửi lên sai cú pháp hoặc không hợp lệ.', 400, 'MALFORMED_JSON');
  }

  // 3. Handle Multer Errors
  else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('Kích thước tệp tin vượt quá giới hạn cho phép.', 413, 'FILE_TOO_LARGE');
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new AppError('Số lượng tệp tin tải lên vượt quá giới hạn cho phép.', 400, 'TOO_MANY_FILES');
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new AppError(`Trường upload tệp không hợp lệ: ${err.field || ''}`.trim(), 400, 'INVALID_FILE');
    } else {
      error = new AppError(err.message, 400, 'INVALID_FILE');
    }
  }

  // 4. Handle Mongoose and JWT specific errors
  else if (err.name === 'CastError') {
    error = new AppError(`Mã định danh (ID) không hợp lệ: ${err.value}.`, 400, 'INVALID_ID');
  }
  else if (err.code === 11000) {
    const value = err.message.match(/(["'])(\\?.)*?\1/)?.[0] || 'Field';
    error = new AppError(`Dữ liệu đã tồn tại: ${value}. Vui lòng sử dụng giá trị khác!`, 400, 'DUPLICATE_FIELD');
  }
  else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map(el => el.message);
    error = new AppError(`Dữ liệu nhập vào không hợp lệ. ${errors.join('. ')}`, 400, 'VALIDATION_ERROR');
  }
  else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token xác thực không hợp lệ. Vui lòng đăng nhập lại!', 401, 'INVALID_TOKEN');
  }
  else if (err.name === 'TokenExpiredError') {
    error = new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 401, 'TOKEN_EXPIRED');
  }
  else if (!(error instanceof AppError)) {
    error = new AppError(err.message, err.statusCode || 500);
    error.isOperational = Boolean(err.statusCode && err.statusCode < 500);
    error.stack = err.stack;
  }

  // Preserve details if available
  if (err.details && !error.details) {
    error.details = err.details;
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};
