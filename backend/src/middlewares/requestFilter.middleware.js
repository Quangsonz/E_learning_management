const AppError = require('../utils/appError');

/**
 * Request Filter Middleware:
 * 1. Chặn URL / Query string quá dài (> 2048 ký tự)
 * 2. Kiểm tra Content-Type cho POST, PUT, PATCH
 * 3. Từ chối các request có số lượng bản ghi quá lớn (limit > 100) hoặc page không hợp lệ
 */
const requestFilter = (req, res, next) => {
  // 1. Chặn query string quá dài (chống DoS / Buffer overflow)
  const fullUrl = req.originalUrl || req.url || '';
  if (fullUrl.length > 2048) {
    return next(
      new AppError(
        'Độ dài URL hoặc Query String vượt quá giới hạn cho phép (tối đa 2048 ký tự).',
        414,
        'URI_TOO_LONG'
      )
    );
  }

  // 2. Kiểm tra Content-Type đối với POST, PUT, PATCH nếu có body
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const hasBody = contentLength > 0 || req.headers['transfer-encoding'] !== undefined;
  const mutatingMethods = ['POST', 'PUT', 'PATCH'];

  if (mutatingMethods.includes(req.method) && hasBody) {
    const contentType = req.headers['content-type'] || '';
    // Cho phép json, urlencoded, multipart/form-data, hoặc raw json (stripe webhook)
    const isValidType =
      req.is('json') ||
      req.is('urlencoded') ||
      req.is('multipart') ||
      contentType.includes('application/json');

    if (!isValidType) {
      return next(
        new AppError(
          'Định dạng Content-Type không được hỗ trợ. Vui lòng sử dụng application/json hoặc multipart/form-data.',
          415,
          'UNSUPPORTED_MEDIA_TYPE'
        )
      );
    }
  }

  // 3. Từ chối request có số lượng bản ghi phân trang quá lớn (> 100) hoặc page < 1 (Chống DoS / Memory Exhaustion)
  if (req.query) {
    if (req.query.limit !== undefined) {
      const parsedLimit = parseInt(req.query.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit > 100 || parsedLimit < 1) {
        return next(
          new AppError(
            'Số lượng bản ghi yêu cầu không hợp lệ hoặc vượt quá giới hạn cho phép (tối đa 100 bản ghi/trang).',
            400,
            'LIMIT_EXCEEDED'
          )
        );
      }
    }

    if (req.query.page !== undefined) {
      const parsedPage = parseInt(req.query.page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return next(
          new AppError(
            'Số trang (page) không hợp lệ (phải là số nguyên dương từ 1 trở lên).',
            400,
            'INVALID_PAGE'
          )
        );
      }
    }
  }

  next();
};

/**
 * Middleware bắt lỗi cú pháp JSON bị hỏng (Malformed JSON)
 */
const handleJsonSyntaxError = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'fail',
      errorCode: 'MALFORMED_JSON',
      message: 'Dữ liệu JSON gửi lên sai cú pháp hoặc không hợp lệ.'
    });
  }
  next(err);
};

module.exports = {
  requestFilter,
  handleJsonSyntaxError
};
