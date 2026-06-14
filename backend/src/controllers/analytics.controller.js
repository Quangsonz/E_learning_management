const analyticsService = require('../services/analytics.service');
const catchAsync = require('../utils/catchAsync');

class AnalyticsController {
  // Chỉ Admin mới được xem
  getAdminDashboard = catchAsync(async (req, res, next) => {
    const data = await analyticsService.getAdminDashboard();

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  // Giảng viên xem dashboard của chính họ
  getTeacherDashboard = catchAsync(async (req, res, next) => {
    const data = await analyticsService.getTeacherDashboard(req.user.id);

    res.status(200).json({
      status: 'success',
      data,
    });
  });
}

module.exports = new AnalyticsController();
