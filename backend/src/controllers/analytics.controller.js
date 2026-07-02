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

  /**
   * GET /api/analytics/orders
   * Admin xem danh sách orders và revenue summary
   */
  getOrderStats = catchAsync(async (req, res, next) => {
    const data = await analyticsService.getOrderStats(req.query);

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  getSystemHealth = catchAsync(async (req, res, next) => {
    const data = await analyticsService.getSystemHealth();

    res.status(200).json({
      status: 'success',
      data,
    });
  });

  /**
   * GET /api/analytics/export-pdf
   * Xuất báo cáo tài chính PDF cho một tháng/năm xác định
   */
  exportFinancialReportPDF = catchAsync(async (req, res, next) => {
    const { month, year } = req.query;
    const reportMonth = parseInt(month, 10) || new Date().getMonth() + 1;
    const reportYear = parseInt(year, 10) || new Date().getFullYear();

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 1);

    const Order = require('../models/Order');
    const pdfGenerator = require('../utils/pdfGenerator');

    // Lấy các đơn hàng có trạng thái paid trong tháng được chọn
    const orders = await Order.find({
      status: 'paid',
      createdAt: { $gte: startDate, $lt: endDate }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('course', 'title');

    const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const totalPaidOrders = orders.length;
    const avgOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

    const summary = { totalRevenue, totalPaidOrders, avgOrderValue };

    // Trả về file PDF cho client download trực tiếp
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=financial-report-${reportMonth}-${reportYear}.pdf`);

    pdfGenerator.generateFinancialReportPDF(res, orders, summary, reportMonth, reportYear);
  });
}

module.exports = new AnalyticsController();
