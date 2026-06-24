const dashboardService = require('../services/dashboard.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Middleware helper: Kiểm tra học viên chỉ được xem dashboard của chính mình.
 * (Trừ admin có thể xem của bất kỳ ai.)
 */
const authorizeStudentAccess = (req, next) => {
  const requestedId = req.params.id;
  const currentUserId = req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && requestedId !== currentUserId) {
    return next(new AppError('Bạn không có quyền xem dashboard của học viên khác.', 403));
  }
  return null;
};

class DashboardController {
  /**
   * GET /api/v1/students/:id/dashboard/stats
   * Trả về thống kê tổng quan: learningRing, stats, heroStats.
   */
  getStats = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getDashboardStats(req.params.id);

    res.status(200).json({
      status: 'success',
      data
    });
  });

  /**
   * GET /api/v1/students/:id/dashboard/active-courses
   * Trả về danh sách khóa học đang học.
   */
  getActiveCourses = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getActiveCourses(req.params.id);

    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  });

  /**
   * GET /api/v1/students/:id/dashboard/upcoming-quizzes
   * Trả về danh sách bài kiểm tra sắp tới.
   */
  getUpcomingQuizzes = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getUpcomingQuizzes(req.params.id);

    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  });

  /**
   * GET /api/v1/students/:id/dashboard/recent-activities
   * Trả về danh sách hoạt động gần đây (xem bài học + làm quiz).
   */
  getRecentActivities = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getRecentActivities(req.params.id);

    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  });

  /**
   * GET /api/v1/students/:id/dashboard/recommended-courses
   * Trả về danh sách khóa học đề xuất dựa trên preferences.
   */
  getRecommendedCourses = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getRecommendedCourses(req.params.id);

    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  });

  /**
   * GET /api/v1/students/:id/dashboard/announcements
   * Trả về danh sách thông báo mới nhất của học viên.
   */
  getAnnouncements = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getAnnouncements(req.params.id);

    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  });

  /**
   * GET /api/v1/students/:id/dashboard/summary
   * Controller tổng hợp: Gọi song song 6 service methods qua Promise.all().
   * Trả về toàn bộ dữ liệu Dashboard trong 1 request duy nhất.
   * 
   * Kỹ thuật tối ưu:
   *  - Promise.all(): Các query chạy đồng thời, tổng thời gian = query chậm nhất.
   *  - Error isolation: Nếu 1 phần lỗi, các phần còn lại vẫn trả về bình thường.
   *  - Response gộp giảm HTTP overhead từ 6 round-trips xuống còn 1.
   */
  getDashboardSummary = catchAsync(async (req, res, next) => {
    const authError = authorizeStudentAccess(req, next);
    if (authError) return authError;

    const data = await dashboardService.getDashboardSummary(req.params.id);

    res.status(200).json({
      status: 'success',
      data
    });
  });
}

module.exports = new DashboardController();
