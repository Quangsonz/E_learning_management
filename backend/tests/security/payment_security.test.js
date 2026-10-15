const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Course = require('../../src/models/Course');
const Category = require('../../src/models/Category');
const Order = require('../../src/models/Order');
const Enrollment = require('../../src/models/Enrollment');
const Lesson = require('../../src/models/Lesson');
const AuditLog = require('../../src/models/AuditLog');
const paymentController = require('../../src/controllers/payment.controller');
const enrollmentService = require('../../src/services/enrollment.service');
const lessonService = require('../../src/services/lesson.service');
const AppError = require('../../src/utils/appError');

describe('Payment Security & VietQR Comprehensive Tests', () => {
  let student, instructor, admin, category, publishedCourse, draftCourse;
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  beforeEach(async () => {
    // Tạo category
    category = await Category.create({
      name: { vi: 'Lập trình', en: 'Programming' },
      slug: 'lap-trinh-' + Date.now(),
    });

    // Tạo instructor
    instructor = await User.create({
      name: 'Teacher Minh',
      email: `teacher_${Date.now()}@test.com`,
      password: 'password123',
      role: 'teacher',
    });

    // Tạo student
    student = await User.create({
      name: 'Student Son',
      email: `student_${Date.now()}@test.com`,
      password: 'password123',
      role: 'student',
    });

    // Tạo admin
    admin = await User.create({
      name: 'Admin Quan',
      email: `admin_${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin',
    });

    // Tạo khóa học published có phí
    publishedCourse = await Course.create({
      title: { vi: 'Khóa học Node.js', en: 'Node.js Course' },
      description: { vi: 'Mô tả', en: 'Description' },
      price: 500000,
      instructor: instructor._id,
      category: category._id,
      status: 'published',
    });

    // Tạo khóa học draft
    draftCourse = await Course.create({
      title: { vi: 'Khóa học Draft', en: 'Draft Course' },
      description: { vi: 'Bản nháp', en: 'Draft' },
      price: 200000,
      instructor: instructor._id,
      category: category._id,
      status: 'draft',
    });
  });

  // =========================================================================
  // TC-01: Tạo đơn hàng VietQR chuẩn xác, sinh orderCode và transferContent duy nhất
  // =========================================================================
  it('TC-01: Should create a valid VietQR order with unique orderCode and 15-minute expiry', async () => {
    const req = {
      user: student,
      body: { courseId: publishedCourse._id.toString() },
    };
    let responseData = null;
    const res = {
      status: (code) => {
        expect(code).toBe(200);
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const next = jest.fn();

    await paymentController.createQROrder(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(responseData).toBeDefined();
    expect(responseData.status).toBe('success');
    expect(responseData.data.amount).toBe(500000);
    expect(responseData.data.orderCode).toMatch(/^ORD\d{6}[0-9A-Z]{6}$/);
    expect(responseData.data.bankInfo.transferContent).toBe(`EL ${responseData.data.orderCode}`);
    expect(responseData.data.qrUrl).toContain('img.vietqr.io');
    expect(responseData.data.fallbackQrDataUrl).toMatch(/^data:image\/png;base64,/);

    // Kiểm tra trong database
    const savedOrder = await Order.findById(responseData.data.orderId);
    expect(savedOrder).toBeDefined();
    expect(savedOrder.status).toBe('pending');
    expect(savedOrder.paymentMethod).toBe('vietqr');
    expect(new Date(savedOrder.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  // =========================================================================
  // TC-02: Chặn tạo đơn hàng nếu học viên đã đăng ký khóa học
  // =========================================================================
  it('TC-02: Should reject QR order creation if student is already enrolled', async () => {
    await Enrollment.create({
      student: student._id,
      course: publishedCourse._id,
      paymentStatus: 'completed',
    });

    const req = {
      user: student,
      body: { courseId: publishedCourse._id.toString() },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.createQROrder(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Bạn đã đăng ký khóa học này rồi');
  });

  // =========================================================================
  // TC-03: Chặn tạo đơn hàng cho khóa học chưa xuất bản (Draft)
  // =========================================================================
  it('TC-03: Should reject QR order creation for unpublished/draft course', async () => {
    const req = {
      user: student,
      body: { courseId: draftCourse._id.toString() },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.createQROrder(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain('Khóa học chưa được mở bán chính thức');
  });

  // =========================================================================
  // TC-04: Tự động chuyển đơn hàng sang expired khi quá hạn 15 phút
  // =========================================================================
  it('TC-04: Should automatically mark order as expired when 15-minute window is passed', async () => {
    // Tạo đơn hàng đã hết hạn từ 5 phút trước
    const expiredOrder = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015OLD1',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015OLD1',
      status: 'pending',
      expiresAt: new Date(Date.now() - 5 * 60 * 1000), // Đã hết hạn
    });

    const req = {
      user: student,
      params: { orderId: expiredOrder._id.toString() },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.getOrderStatus(req, res, next);
    expect(responseData.data.order.status).toBe('expired');

    // Kiểm tra DB đã được cập nhật
    const reloaded = await Order.findById(expiredOrder._id);
    expect(reloaded.status).toBe('expired');
  });

  // =========================================================================
  // TC-05: Chặn học viên tra cứu đơn hàng của người khác (IDOR Protection)
  // =========================================================================
  it('TC-05: Should block student from viewing another user order (IDOR Protection)', async () => {
    const otherStudent = await User.create({
      name: 'Other Student',
      email: `other_${Date.now()}@test.com`,
      password: 'password123',
    });

    const order = await Order.create({
      user: otherStudent._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015OTHR',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // student gọi API tra cứu đơn hàng của otherStudent
    const req = {
      user: student,
      params: { orderId: order._id.toString() },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.getOrderStatus(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  // =========================================================================
  // TC-06: Học viên xác nhận đã chuyển khoản -> chuyển sang pending_verification
  // =========================================================================
  it('TC-06: Should transition order to pending_verification when student confirms transfer', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015TX01',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015TX01',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: student,
      params: { orderId: order._id.toString() },
      body: { transactionReference: 'FT242888999' },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.confirmTransfer(req, res, next);
    expect(responseData.status).toBe('success');
    expect(responseData.data.order.status).toBe('pending_verification');
    expect(responseData.data.order.bankTransactionId).toBe('FT242888999');

    // Không tự động tạo Enrollment tại bước này (Zero Trust)
    const enrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
    expect(enrollment).toBeNull();
  });

  // =========================================================================
  // TC-07: Admin duyệt đơn hàng thủ công -> cập nhật paid và kích hoạt Enrollment
  // =========================================================================
  it('TC-07: Should allow Admin to manually verify order, marking it paid and enrolling student', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015ADM1',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015ADM1',
      status: 'pending_verification',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: admin,
      params: { orderId: order._id.toString() },
      body: { bankTransactionId: 'MB-12345678', adminNote: 'Sao kê MBBank tiền đã về' },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.adminVerifyOrder(req, res, next);
    expect(responseData.status).toBe('success');
    expect(responseData.data.order.status).toBe('paid');
    expect(responseData.data.order.paidAt).toBeDefined();

    // Xác nhận Enrollment đã được tạo
    const enrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
    expect(enrollment).toBeDefined();
    expect(enrollment.paymentStatus).toBe('completed');
  });

  // =========================================================================
  // TC-08: Bank Webhook tự động kích hoạt thanh toán khi nhận đúng orderCode và amount
  // =========================================================================
  it('TC-08: Should automatically confirm payment and enroll student via Bank Webhook', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015AUTO',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015AUTO',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD261015AUTO',
        amount: 500000,
        transactionId: 'TX-BANK-999',
        content: 'EL ORD261015AUTO CHUYEN TIEN HOC',
      },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(responseData.status).toBe('success');

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe('paid');
    expect(updatedOrder.bankTransactionId).toBe('TX-BANK-999');

    const enrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
    expect(enrollment).toBeDefined();
    expect(enrollment.paymentStatus).toBe('completed');
  });

  // =========================================================================
  // TC-09: Bank Webhook Idempotency (Gửi lại cùng một transaction không tạo lỗi hoặc duplicate)
  // =========================================================================
  it('TC-09: Should handle duplicate webhook calls idempotently without duplicate enrollments', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015IDEM',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015IDEM',
      status: 'paid', // Đã thanh toán từ trước
      paidAt: new Date(),
    });

    await Enrollment.create({
      student: student._id,
      course: publishedCourse._id,
      paymentStatus: 'completed',
    });

    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD261015IDEM',
        amount: 500000,
        transactionId: 'TX-BANK-RETRY',
      },
    };
    let responseData = null;
    const res = {
      status: (code) => {
        expect(code).toBe(200);
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(responseData.received).toBe(true);

    // Không tạo thêm bản ghi Enrollment trùng
    const enrollments = await Enrollment.find({ student: student._id, course: publishedCourse._id });
    expect(enrollments.length).toBe(1);
  });

  // =========================================================================
  // TC-10: Bank Webhook từ chối nếu số tiền chuyển nhỏ hơn giá đơn hàng (Underpaid)
  // =========================================================================
  it('TC-10: Should reject bank webhook if transferred amount is less than order amount', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015LESS',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015LESS',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD261015LESS',
        amount: 100000, // Chuyển thiếu 400.000đ
        transactionId: 'TX-BANK-LESS',
      },
    };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: () => {},
        };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(400);

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder.status).toBe('pending'); // Không được chuyển thành paid!
  });

  // =========================================================================
  // TC-11: Bank Webhook chặn request không có secret hoặc sai secret
  // =========================================================================
  it('TC-11: Should reject webhook request with 401 Unauthorized if secret is invalid', async () => {
    process.env.BANK_WEBHOOK_SECRET = 'super_secret_webhook_token_123';

    const req = {
      headers: { 'x-api-key': 'wrong_secret_token' },
      query: {},
      body: { orderCode: 'ORD_DUMMY', amount: 500000 },
    };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(401);
  });

  // =========================================================================
  // TC-12: Bank Webhook chấp nhận request khi secret hợp lệ (Constant-Time Safe)
  // =========================================================================
  it('TC-12: Should accept webhook request when secret matches valid key', async () => {
    process.env.BANK_WEBHOOK_SECRET = 'super_secret_webhook_token_123';

    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015SEC1',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      transferContent: 'EL ORD261015SEC1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      headers: { 'x-api-key': 'super_secret_webhook_token_123' },
      query: {},
      body: {
        orderCode: 'ORD261015SEC1',
        amount: 500000,
        transactionId: 'TX-SEC-001',
      },
    };
    let statusCode = 200;
    let responseData = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(200);
    expect(responseData.status).toBe('success');

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('paid');
  });

  // =========================================================================
  // TC-13: Bank Webhook chặn Replay Attack khi mã giao dịch ngân hàng đã được dùng cho đơn khác
  // =========================================================================
  it('TC-13: Should reject webhook with 409 Conflict if bank transaction ID is reused (Replay Protection)', async () => {
    // Đơn thứ nhất đã thanh toán với transactionId 'TX-BANK-ALREADY-USED'
    await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015PAID1',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      bankTransactionId: 'TX-BANK-ALREADY-USED',
      status: 'paid',
      paidAt: new Date(),
    });

    // Đơn thứ hai đang chờ thanh toán
    const newOrder = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015REPLAY',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Attacker cố tình gửi webhook cho newOrder với mã giao dịch của đơn thứ nhất
    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD261015REPLAY',
        amount: 500000,
        transactionId: 'TX-BANK-ALREADY-USED',
      },
    };
    let statusCode = 200;
    let responseData = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(409);
    expect(responseData.message).toContain('Replay Attack Prevention');

    // Đơn mới vẫn ở trạng thái pending
    const reloaded = await Order.findById(newOrder._id);
    expect(reloaded.status).toBe('pending');
  });

  // =========================================================================
  // TC-14: Bank Webhook xử lý Overpayment (Chuyển thừa tiền)
  // =========================================================================
  it('TC-14: Should accept order, enroll student, and flag overpayment in adminNote', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015OVER',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD261015OVER',
        amount: 600000, // Chuyển thừa 100.000 VND
        transactionId: 'TX-OVER-999',
      },
    };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(200);

    const reloaded = await Order.findById(order._id);
    expect(reloaded.status).toBe('paid');
    expect(reloaded.adminNote).toContain('chuyển dư');

    // Học viên vẫn được kích hoạt quyền học
    const enrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
    expect(enrollment).toBeDefined();
    expect(enrollment.paymentStatus).toBe('completed');
  });

  // =========================================================================
  // TC-15: Bank Webhook kích hoạt đơn hàng quá hạn (Late Payment Handling)
  // =========================================================================
  it('TC-15: Should accept late payment for expired order and auto-enroll student', async () => {
    const expiredOrder = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015LATE',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'expired',
      expiresAt: new Date(Date.now() - 30 * 60 * 1000), // Hết hạn 30 phút trước
    });

    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD261015LATE',
        amount: 500000,
        transactionId: 'TX-LATE-888',
      },
    };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(200);

    const reloaded = await Order.findById(expiredOrder._id);
    expect(reloaded.status).toBe('paid');
    expect(reloaded.adminNote).toContain('Đơn hàng quá hạn đã được thanh toán');

    const enrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
    expect(enrollment).toBeDefined();
    expect(enrollment.paymentStatus).toBe('completed');
  });

  // =========================================================================
  // TC-16: Bank Webhook tự động bóc tách orderCode từ nội dung memo ngân hàng
  // =========================================================================
  it('TC-16: Should extract orderCode from transfer memo content regex', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015RGX1',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      headers: {},
      query: {},
      body: {
        amount: 500000,
        transactionId: 'TX-RGX-777',
        content: 'MBVCB.9876543210.ORD261015RGX1.THANH TOAN TIEN HOC KHOA NODEJS',
      },
    };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(200);

    const reloaded = await Order.findById(order._id);
    expect(reloaded.status).toBe('paid');
  });

  // =========================================================================
  // TC-17: Bank Webhook trả về 404 khi không tìm thấy orderCode trong database
  // =========================================================================
  it('TC-17: Should return 404 when orderCode does not match any existing order', async () => {
    const req = {
      headers: {},
      query: {},
      body: {
        orderCode: 'ORD999999NONEXIST',
        amount: 500000,
        transactionId: 'TX-404-001',
      },
    };
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    const next = jest.fn();

    await paymentController.bankWebhook(req, res, next);
    expect(statusCode).toBe(404);
  });

  // =========================================================================
  // TC-18: Demo Simulate bị chặn trong môi trường Production đối với học viên thường
  // =========================================================================
  it('TC-18: Should block demo simulation for regular students in production mode (403 Forbidden)', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_MOCK_PAYMENTS = 'false';

    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015PROD1',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: student,
      body: { orderId: order._id.toString() },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.demoSimulatePayment(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  // =========================================================================
  // TC-19: Demo Simulate hoạt động trong môi trường Sandbox/Dev với mã DEMO-SANDBOX-
  // =========================================================================
  it('TC-19: Should allow demo simulation in dev/sandbox mode and prefix transaction with DEMO-SANDBOX-', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ENABLE_MOCK_PAYMENTS = 'true';

    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015DEV01',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: student,
      body: { orderId: order._id.toString() },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.demoSimulatePayment(req, res, next);
    expect(responseData.status).toBe('success');
    expect(responseData.data.order.status).toBe('paid');
    expect(responseData.data.order.bankTransactionId).toMatch(/^DEMO-SANDBOX-/);
    expect(responseData.data.order.adminNote).toContain('[DEMO SIMULATE]');

    const enrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
    expect(enrollment).toBeDefined();
    expect(enrollment.paymentStatus).toBe('completed');
  });

  // =========================================================================
  // TC-20: Admin được phép chạy Demo Simulate mọi lúc để phục vụ bảo vệ đồ án
  // =========================================================================
  it('TC-20: Should allow Admin to run demo simulation anytime for defense demonstration', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_MOCK_PAYMENTS = 'false';

    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015ADMDEMO',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: admin,
      body: { orderId: order._id.toString() },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.demoSimulatePayment(req, res, next);
    expect(responseData.status).toBe('success');
    expect(responseData.data.order.status).toBe('paid');
  });

  // =========================================================================
  // TC-21: Admin verify chặn duyệt đơn hàng đã được thanh toán trước đó
  // =========================================================================
  it('TC-21: Should reject Admin manual verification if order is already paid', async () => {
    const paidOrder = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015ALRPAID',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'paid',
      paidAt: new Date(),
    });

    const req = {
      user: admin,
      params: { orderId: paidOrder._id.toString() },
      body: { bankTransactionId: 'TX-ADM-NEW' },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.adminVerifyOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toContain('đã được xác nhận thanh toán rồi');
  });

  // =========================================================================
  // TC-22: Admin verify chặn sử dụng lại bankTransactionId của đơn hàng khác
  // =========================================================================
  it('TC-22: Should reject Admin manual verification if bankTransactionId is already used', async () => {
    await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015MBEXIST',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      bankTransactionId: 'MB-EXISTING-999',
      status: 'paid',
      paidAt: new Date(),
    });

    const pendingOrder = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015PEND99',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending_verification',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: admin,
      params: { orderId: pendingOrder._id.toString() },
      body: { bankTransactionId: 'MB-EXISTING-999' },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.adminVerifyOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toContain('đã được sử dụng cho một đơn hàng khác');
  });

  // =========================================================================
  // TC-23: Admin reject từ chối đơn hàng và ghi AuditLog
  // =========================================================================
  it('TC-23: Should allow Admin to reject an order, updating status to cancelled and recording AuditLog', async () => {
    const order = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015REJ01',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'pending_verification',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = {
      user: admin,
      params: { orderId: order._id.toString() },
      body: { reason: 'Không thấy tiền vào tài khoản Techcombank sau 24h' },
    };
    let responseData = null;
    const res = {
      status: () => ({
        json: (data) => {
          responseData = data;
        },
      }),
    };
    const next = jest.fn();

    await paymentController.adminRejectOrder(req, res, next);
    expect(responseData.status).toBe('success');
    expect(responseData.data.order.status).toBe('cancelled');
    expect(responseData.data.order.adminNote).toContain('Không thấy tiền');

    // Kiểm tra AuditLog
    const audit = await AuditLog.findOne({
      targetId: order._id,
      action: 'ADMIN_PAYMENT_REJECTED',
    });
    expect(audit).toBeDefined();
    expect(audit.actor.toString()).toBe(admin._id.toString());
  });

  // =========================================================================
  // TC-24: Admin reject không thể từ chối đơn hàng đã thanh toán thành công
  // =========================================================================
  it('TC-24: Should prevent Admin from rejecting an already paid order', async () => {
    const paidOrder = await Order.create({
      user: student._id,
      course: publishedCourse._id,
      orderCode: 'ORD261015PAIDREJ',
      amount: 500000,
      currency: 'vnd',
      paymentMethod: 'vietqr',
      status: 'paid',
      paidAt: new Date(),
    });

    const req = {
      user: admin,
      params: { orderId: paidOrder._id.toString() },
      body: { reason: 'Nhầm lẫn' },
    };
    const res = {};
    const next = jest.fn();

    await paymentController.adminRejectOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toContain('Không thể từ chối đơn hàng đã thanh toán thành công');
  });

  // =========================================================================
  // TC-25: Chặn học viên trực tiếp gọi API enrollCourse mà không có đơn hàng đã thanh toán
  // =========================================================================
  it('TC-25: Should block direct enrollment bypass for paid course without a paid order (402 Payment Required)', async () => {
    await expect(
      enrollmentService.enrollCourse(publishedCourse._id, student, { isFromPayment: false })
    ).rejects.toThrow('Khóa học này yêu cầu thanh toán trước khi đăng ký!');
  });

  // =========================================================================
  // TC-26: Phân quyền bài học (Lesson Access Control) ẩn videoUrl với học viên chưa thanh toán
  // =========================================================================
  it('TC-26: Should strip videoUrl for unpaid users and retain videoUrl for paid enrolled users', async () => {
    // Tạo 1 bài học khóa và 1 bài học thử miễn phí
    const paidLesson = await Lesson.create({
      course: publishedCourse._id,
      title: { vi: 'Bài 1: Kiến trúc chuyên sâu', en: 'Lesson 1: Deep Architecture' },
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/secret_lesson1.mp4',
      videoPublicId: 'secret_lesson1',
      provider: 'cloudinary',
      order: 1,
      isFreePreview: false,
    });

    const freeLesson = await Lesson.create({
      course: publishedCourse._id,
      title: { vi: 'Bài giới thiệu', en: 'Intro Lesson' },
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/intro.mp4',
      videoPublicId: 'intro',
      provider: 'cloudinary',
      order: 2,
      isFreePreview: true,
    });

    // 1. Học viên CHƯA thanh toán truy cập
    const unpaidLessons = await lessonService.getLessonsByCourse(publishedCourse._id, student);
    const unpaidPaidDoc = unpaidLessons.find(l => l._id.toString() === paidLesson._id.toString());
    const unpaidFreeDoc = unpaidLessons.find(l => l._id.toString() === freeLesson._id.toString());

    // Bài học có phí phải bị xóa videoUrl và videoPublicId
    expect(unpaidPaidDoc.videoUrl).toBeUndefined();
    expect(unpaidPaidDoc.videoPublicId).toBeUndefined();
    // Bài học thử vẫn xem được
    expect(unpaidFreeDoc.videoUrl).toBe('https://res.cloudinary.com/demo/video/upload/intro.mp4');

    // 2. Học viên ĐÃ thanh toán và ghi danh thành công
    await Enrollment.create({
      student: student._id,
      course: publishedCourse._id,
      paymentStatus: 'completed',
    });

    const paidLessons = await lessonService.getLessonsByCourse(publishedCourse._id, student);
    const paidDoc = paidLessons.find(l => l._id.toString() === paidLesson._id.toString());
    // Giờ học viên đã có full access
    expect(paidDoc.videoUrl).toBe('https://res.cloudinary.com/demo/video/upload/secret_lesson1.mp4');
    expect(paidDoc.videoPublicId).toBe('secret_lesson1');
  });
});
