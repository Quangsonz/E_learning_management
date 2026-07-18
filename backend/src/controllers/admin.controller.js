const User = require('../models/User');
const Course = require('../models/Course');
const TeacherApplication = require('../models/TeacherApplication');
const PayoutRequest = require('../models/PayoutRequest');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

class AdminController {
  /**
   * POST /api/admin/teacher-applications/apply
   * Học viên gửi hồ sơ xin làm giảng viên
   */
  applyToTeach = catchAsync(async (req, res, next) => {
    const { specialty, bio, resumeUrl } = req.body;

    if (!specialty || !bio || !resumeUrl) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin: Chuyên môn, mô tả bản thân và link CV.', 400));
    }

    // Kiểm tra xem đã có đơn ứng tuyển nào ở trạng thái pending chưa
    const existingApp = await TeacherApplication.findOne({
      student: req.user.id,
      status: 'pending'
    });

    if (existingApp) {
      return next(new AppError('Bạn đã gửi một yêu cầu ứng tuyển và đang chờ Admin duyệt.', 400));
    }

    const application = await TeacherApplication.create({
      student: req.user.id,
      specialty,
      bio,
      resumeUrl
    });

    res.status(201).json({
      status: 'success',
      message: 'Hồ sơ ứng tuyển của bạn đã được gửi thành công.',
      data: { application }
    });
  });

  /**
   * GET /api/admin/teacher-applications/my-status
   * Học viên lấy trạng thái hồ sơ ứng tuyển mới nhất của mình
   */
  getMyApplicationStatus = catchAsync(async (req, res, next) => {
    const application = await TeacherApplication.findOne({ student: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { application }
    });
  });


  /**
   * GET /api/admin/teacher-applications
   * Lấy danh sách các đơn ứng tuyển giảng viên (Admin only)
   */
  getTeacherApplications = catchAsync(async (req, res, next) => {
    const { status = 'pending', page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const filter = { status };

    const [applications, total] = await Promise.all([
      TeacherApplication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('student', 'name email avatar'),
      TeacherApplication.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  });

  /**
   * POST /api/admin/teacher-applications/:id/action
   * Phê duyệt hoặc từ chối đơn ứng tuyển của học viên (Admin only)
   * Body: { action: 'approve' | 'reject', adminNotes?: string }
   */
  processTeacherApplication = catchAsync(async (req, res, next) => {
    const { action, adminNotes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return next(new AppError('Hành động không hợp lệ. Chỉ chấp nhận approve hoặc reject.', 400));
    }

    const application = await TeacherApplication.findById(req.params.id);
    if (!application) {
      return next(new AppError('Không tìm thấy đơn ứng tuyển này.', 404));
    }

    if (application.status !== 'pending') {
      return next(new AppError('Đơn ứng tuyển này đã được xử lý trước đó.', 400));
    }

    if (action === 'approve') {
      application.status = 'approved';
      // Thay đổi quyền hạn của học viên thành giảng viên
      await User.findByIdAndUpdate(application.student, { role: 'teacher' });
    } else {
      application.status = 'rejected';
    }

    application.adminNotes = adminNotes;
    application.processedBy = req.user.id;
    await application.save();

    res.status(200).json({
      status: 'success',
      message: action === 'approve' ? 'Đã duyệt hồ sơ ứng tuyển. Người dùng đã trở thành giảng viên.' : 'Đã từ chối đơn ứng tuyển giảng viên.',
      data: { application }
    });
  });

  /**
   * GET /api/admin/audit-logs
   * Lấy danh sách nhật ký thao tác (Admin only)
   */
  getAuditLogs = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) {
      filter.action = { $regex: search, $options: 'i' };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('actor', 'name email role avatar'),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: {
        logs,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  });

  /**
   * GET /api/admin/moderation/courses
   * Lấy danh sách khóa học đang chờ duyệt (Admin only)
   */
  getCoursesPendingReview = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const filter = { status: 'pending_review' };

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Course.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: {
        courses,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  });

  /**
   * POST /api/admin/payouts/request
   * Giảng viên gửi yêu cầu rút tiền
   */
  requestPayout = catchAsync(async (req, res, next) => {
    const { amount, bankInfo } = req.body;

    if (!amount || !bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountName) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin số tiền rút và tài khoản ngân hàng.', 400));
    }

    if (amount < 50000) {
      return next(new AppError('Số tiền rút tối thiểu là 50,000đ.', 400));
    }

    const payout = await PayoutRequest.create({
      instructor: req.user.id,
      amount,
      bankInfo
    });

    res.status(201).json({
      status: 'success',
      message: 'Yêu cầu rút tiền của bạn đã được ghi nhận và đang chờ xử lý.',
      data: { payout }
    });
  });

  /**
   * GET /api/admin/payouts
   * Lấy danh sách yêu cầu rút tiền (Admin only)
   */
  getPayoutRequests = catchAsync(async (req, res, next) => {
    const { status = 'pending', page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const filter = { status };

    const [payouts, total] = await Promise.all([
      PayoutRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('instructor', 'name email avatar'),
      PayoutRequest.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: payouts.length,
      data: {
        payouts,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  });

  /**
   * PATCH /api/admin/payouts/:id/complete
   * Phê duyệt hoàn thành yêu cầu rút tiền (Admin only)
   */
  completePayoutRequest = catchAsync(async (req, res, next) => {
    const { transactionProofUrl } = req.body;

    if (!transactionProofUrl) {
      return next(new AppError('Vui lòng cung cấp hình ảnh minh chứng giao dịch đã chuyển khoản thành công.', 400));
    }

    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) {
      return next(new AppError('Không tìm thấy yêu cầu rút tiền này.', 404));
    }

    if (payout.status !== 'pending') {
      return next(new AppError('Yêu cầu rút tiền này đã được xử lý trước đó.', 400));
    }

    payout.status = 'completed';
    payout.transactionProofUrl = transactionProofUrl;
    payout.processedBy = req.user.id;
    await payout.save();

    res.status(200).json({
      status: 'success',
      message: 'Đã hoàn tất thanh toán yêu cầu rút tiền giảng viên.',
      data: { payout }
    });
  });
}

module.exports = new AdminController();
