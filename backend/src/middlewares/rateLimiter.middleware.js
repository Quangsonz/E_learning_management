const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * 1. Global API Rate Limiter
 * - Production: 500 requests per 15 minutes per IP
 * - Development/Test: 10,000 requests to avoid disrupting development and test runs
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev || isTest ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX, 10) || 500),
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.headers['x-test-client-id'] || ipKeyGenerator(req.ip),
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút!'
    });
  }
});

/**
 * 2. Elevated Limiter for Admins and Teachers
 * - Production: 5,000 requests per 15 minutes
 * - Development: 50,000 requests
 */
const adminTeacherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev || isTest ? 50000 : 5000,
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.headers['x-test-client-id'] || ipKeyGenerator(req.ip),
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Quá nhiều yêu cầu quản trị từ địa chỉ IP này. Vui lòng thử lại sau 15 phút!'
    });
  }
});

/**
 * 3. Dynamic Limiter based on user role (Admin/Teacher gets higher throughput)
 */
const dynamicLimiter = (req, res, next) => {
  let isAdminOrTeacher = false;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && ['admin', 'teacher'].includes(decoded.role)) {
        isAdminOrTeacher = true;
      }
    }
  } catch (err) {}

  if (isAdminOrTeacher) {
    return adminTeacherLimiter(req, res, next);
  }
  return globalLimiter(req, res, next);
};

/**
 * 4. Authentication Rate Limiter (Anti Brute-Force & Credential Stuffing)
 * - Maximum 5 attempts per 10-15 minutes
 * - Protects: login, register, forgot-password, reset-password, verify-email
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 attempts
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.headers['x-test-client-id'] || ipKeyGenerator(req.ip),
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Quá nhiều lần thử xác thực. Để đảm bảo an toàn, vui lòng thử lại sau 15 phút!'
    });
  }
});

/**
 * 5. Search Rate Limiter (Anti ReDoS and Search Query Flooding)
 * - Production: 60 requests per minute
 * - Development/Test: 10,000 requests
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev || isTest ? 10000 : 60,
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.headers['x-test-client-id'] || ipKeyGenerator(req.ip),
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau 1 phút!'
    });
  }
});

/**
 * 6. Upload Rate Limiter (Anti Storage Flooding)
 * - Production: 30 uploads per 15 minutes
 * - Development/Test: 1,000 uploads
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev || isTest ? 1000 : 30,
  standardHeaders: 'draft-7',
  legacyHeaders: true,
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.headers['x-test-client-id'] || ipKeyGenerator(req.ip),
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      message: 'Quá nhiều yêu cầu tải lên tệp tin. Vui lòng thử lại sau 15 phút!'
    });
  }
});

module.exports = {
  globalLimiter,
  adminTeacherLimiter,
  dynamicLimiter,
  authLimiter,
  searchLimiter,
  uploadLimiter
};
