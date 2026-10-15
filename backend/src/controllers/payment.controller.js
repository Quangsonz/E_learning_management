const crypto = require('crypto');
const QRCode = require('qrcode');
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/Order');
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const enrollmentRepository = require('../repositories/enrollment.repository');
const enrollmentService = require('../services/enrollment.service');
const notificationService = require('../services/notification.service');
const { getLocalizedText } = require('../utils/localizedHelper');

/**
 * Sinh mã đơn hàng duy nhất và dễ đọc cho người dùng: ORD-YYMMDD-XXXX
 */
const generateUniqueOrderCode = async () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  for (let i = 0; i < 5; i++) {
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
    const candidateCode = `ORD${dateStr}${randomSuffix}`;
    const exists = await Order.exists({ orderCode: candidateCode });
    if (!exists) {
      return candidateCode;
    }
  }
  return `ORD${Date.now()}`;
};

/**
 * So sánh chuỗi an toàn theo thời gian hằng số (Constant-Time Comparison) để ngăn chặn Timing Attacks
 */
const safeStringCompare = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

class PaymentController {
  // ==================================================
  // 1. STRIPE PAYMENT INTENT
  // ==================================================
  createPaymentIntent = catchAsync(async (req, res, next) => {
    if (!stripe) {
      return next(new AppError('Stripe API key is not configured on the server.', 500));
    }

    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Không tìm thấy khóa học này', 404));
    }

    if (course.status !== 'published') {
      return next(new AppError('Khóa học chưa được phát hành để thanh toán', 400));
    }

    // Kiểm tra học viên đã đăng ký khóa này chưa
    const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(req.user._id, course._id);
    if (existingEnrollment) {
      return next(new AppError('Bạn đã đăng ký khóa học này rồi!', 400));
    }

    const amount = Math.round((course.price || 0) * 100);
    if (amount <= 0) {
      return next(new AppError('Khóa học miễn phí. Vui lòng đăng ký trực tiếp.', 400));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        courseId: course._id.toString(),
      },
    });

    const orderCode = await generateUniqueOrderCode();

    // Tạo đơn hàng pending
    await Order.create({
      user: req.user._id,
      course: course._id,
      orderCode,
      amount: amount / 100,
      currency: 'usd',
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour for Stripe
    });

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
      orderCode,
    });
  });

  // ==================================================
  // 2. STRIPE WEBHOOK
  // ==================================================
  webhook = catchAsync(async (req, res, next) => {
    if (!stripe) {
      return res.status(500).send('Stripe API key is not configured');
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, courseId } = paymentIntent.metadata || {};

      // Tìm và cập nhật order
      const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });

      if (order) {
        // Idempotency: nếu đơn đã được xác nhận trước đó thì không làm lại
        if (order.status !== 'paid') {
          order.status = 'paid';
          order.paidAt = new Date();
          order.adminNote = 'Xác nhận tự động qua Stripe Webhook';
          await order.save();
        }

        if (userId && courseId) {
          const alreadyEnrolled = await enrollmentRepository.findByStudentAndCourse(userId, courseId);
          if (!alreadyEnrolled) {
            try {
              await enrollmentService.enrollCourse(courseId, { id: userId, _id: userId }, {
                isFromPayment: true,
                existingOrderId: order._id,
              });
            } catch (err) {
              console.error('[Stripe Webhook] Auto-enrollment failed:', err);
              await AuditLog.create({
                user: userId,
                action: 'PAYMENT_ENROLLMENT_FAILED',
                targetModel: 'Course',
                targetId: courseId,
                details: { paymentIntentId: paymentIntent.id, error: err.message },
              }).catch(() => {});
            }
          }
        }
      }
    }

    res.status(200).json({ received: true });
  });

  // ==================================================
  // 3. VIETQR: CREATE QR ORDER
  // ==================================================
  createQROrder = catchAsync(async (req, res, next) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Không tìm thấy khóa học này', 404));
    }

    if (course.status !== 'published') {
      return next(new AppError('Khóa học chưa được mở bán chính thức', 400));
    }

    // 1. Kiểm tra xem học viên đã sở hữu khóa học chưa
    const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(req.user._id, course._id);
    if (existingEnrollment) {
      return next(new AppError('Bạn đã đăng ký khóa học này rồi!', 400));
    }

    // 2. Kiểm tra xem đã có đơn hàng paid chưa
    const existingPaidOrder = await Order.findOne({
      user: req.user._id,
      course: course._id,
      status: 'paid',
    });
    if (existingPaidOrder) {
      return next(new AppError('Bạn đã thanh toán khóa học này rồi. Vui lòng vào trang học!', 400));
    }

    // 3. Giá bán chính xác lấy từ khóa học
    const coursePrice = Number(course.price) || 0;
    if (coursePrice <= 0) {
      return next(new AppError('Khóa học này miễn phí. Vui lòng nhấn đăng ký trực tiếp.', 400));
    }

    // 4. Kiểm tra đơn hàng pending hoặc pending_verification hiện có
    let order = await Order.findOne({
      user: req.user._id,
      course: course._id,
      status: { $in: ['pending', 'pending_verification'] },
    }).sort({ createdAt: -1 });

    const now = new Date();

    // Nếu đơn hàng cũ đã quá hạn 15 phút, cập nhật trạng thái 'expired' và tạo đơn mới
    if (order && order.expiresAt && order.expiresAt < now) {
      order.status = 'expired';
      await order.save();
      order = null;
    }

    // Nếu không có đơn hàng hợp lệ hoặc giá khóa học bị thay đổi -> Tạo đơn mới
    if (!order || order.amount !== coursePrice) {
      const orderCode = await generateUniqueOrderCode();
      const transferContent = `EL ${orderCode}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

      order = await Order.create({
        user: req.user._id,
        course: course._id,
        orderCode,
        amount: coursePrice,
        currency: 'vnd',
        paymentMethod: 'vietqr',
        transferContent,
        status: 'pending',
        expiresAt,
      });
    }

    const bankId = process.env.VIETQR_BANK_ID || 'VCB';
    const bankAccount = process.env.VIETQR_ACCOUNT_NO || '6956969696';
    const accountName = process.env.VIETQR_ACCOUNT_NAME || 'HOANG QUANG SON';
    const bankFullName = process.env.VIETQR_BANK_NAME || 'Vietcombank (Ngân hàng TMCP Ngoại Thương)';

    // URL ảnh VietQR chuẩn NAPAS 247
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact2.png?amount=${order.amount}&addInfo=${encodeURIComponent(order.transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    // Tạo mã QR dự phòng offline (Base64 Data URL) phòng trường hợp CDN vietqr.io bị chặn/mất mạng
    let fallbackQrDataUrl = '';
    try {
      // Chuỗi EMVCo / QuickLink chuẩn
      const rawQrPayload = `https://api.vietqr.io/${bankId}/${bankAccount}?amount=${order.amount}&memo=${encodeURIComponent(order.transferContent)}`;
      fallbackQrDataUrl = await QRCode.toDataURL(rawQrPayload, {
        margin: 2,
        width: 320,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (qrErr) {
      console.warn('[VietQR] Failed to generate local fallback QR:', qrErr.message);
    }

    res.status(200).json({
      status: 'success',
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        status: order.status,
        amount: order.amount,
        expiresAt: order.expiresAt,
        qrUrl,
        fallbackQrDataUrl,
        bankInfo: {
          bankId,
          bankName: bankFullName,
          accountNumber: bankAccount,
          accountName: accountName,
          amount: order.amount,
          transferContent: order.transferContent,
        },
      },
    });
  });

  // ==================================================
  // 4. GET ORDER STATUS (REAL-TIME POLLING)
  // ==================================================
  getOrderStatus = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate('course', 'title price thumbnailUrl')
      .populate('user', 'name email');

    if (!order) {
      return next(new AppError('Không tìm thấy đơn hàng này', 404));
    }

    // Bảo mật: Chỉ chủ sở hữu đơn hàng hoặc Quản trị viên mới được xem
    const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new AppError('Bạn không có quyền truy cập đơn hàng này', 403));
    }

    // Tự động chuyển expired nếu hết hạn 15 phút
    if (order.status === 'pending' && order.expiresAt && order.expiresAt < new Date()) {
      order.status = 'expired';
      await order.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        order,
      },
    });
  });

  // ==================================================
  // 5. SUBMIT TRANSFER PROOF (HỌC VIÊN XÁC NHẬN ĐÃ CHUYỂN KHOẢN)
  // ==================================================
  confirmTransfer = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const { transactionReference } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Không tìm thấy đơn hàng này', 404));
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Bạn không có quyền thao tác trên đơn hàng này', 403));
    }

    if (order.status === 'paid') {
      return res.status(200).json({
        status: 'success',
        message: 'Đơn hàng này đã được xác nhận thanh toán thành công!',
        data: { order },
      });
    }

    if (order.status === 'expired' || (order.expiresAt && order.expiresAt < new Date())) {
      order.status = 'expired';
      await order.save();
      return next(new AppError('Mã thanh toán của đơn hàng này đã hết hạn. Vui lòng tạo đơn mới!', 400));
    }

    order.status = 'pending_verification';
    if (transactionReference) {
      order.bankTransactionId = String(transactionReference).trim();
    }
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Hệ thống đã ghi nhận thông tin chuyển khoản. Vui lòng giữ màn hình hoặc đợi Admin đối soát sao kê.',
      data: { order },
    });
  });

  // ==================================================
  // 6. BANK WEBHOOK (TIẾP NHẬN BIẾN ĐỘNG SỐ DƯ NGÂN HÀNG)
  // ==================================================
  bankWebhook = catchAsync(async (req, res, next) => {
    const webhookSecret = process.env.BANK_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
    const receivedKey = req.headers['x-api-key'] || req.headers['x-webhook-secret'] || req.query.token;

    // Kiểm tra token xác thực nếu server cấu hình secret (bảo vệ chống timing attack)
    if (webhookSecret) {
      if (!receivedKey || !safeStringCompare(receivedKey, webhookSecret)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized webhook request' });
      }
    }

    const { orderCode, amount, transactionId, content, transferContent } = req.body || {};

    // Tìm orderCode trực tiếp hoặc bóc tách từ nội dung chuyển khoản
    let targetCode = orderCode;
    if (!targetCode && (content || transferContent)) {
      const fullContent = content || transferContent;
      const match = fullContent.match(/ORD[0-9A-Z]+/i);
      if (match) {
        targetCode = match[0].toUpperCase();
      }
    }

    if (!targetCode) {
      return res.status(400).json({ status: 'error', message: 'Không tìm thấy mã đơn hàng trong nội dung giao dịch' });
    }

    const order = await Order.findOne({
      $or: [
        { orderCode: targetCode },
        { transferContent: new RegExp(targetCode, 'i') },
      ],
    });

    if (!order) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy đơn hàng với mã ${targetCode}` });
    }

    // Idempotency: Nếu đơn đã thanh toán, trả về 200 an toàn, không xử lý lặp
    if (order.status === 'paid') {
      return res.status(200).json({ received: true, message: 'Đơn hàng đã được thanh toán trước đó' });
    }

    // Kiểm tra chống tấn công Replay Transaction ID (1 mã giao dịch ngân hàng chỉ được gán cho 1 đơn hàng duy nhất)
    if (transactionId) {
      const existingPaidOrderWithTx = await Order.findOne({
        bankTransactionId: String(transactionId).trim(),
        status: 'paid',
        _id: { $ne: order._id },
      });
      if (existingPaidOrderWithTx) {
        return res.status(409).json({
          status: 'error',
          message: 'Mã giao dịch ngân hàng này đã được ghi nhận cho đơn hàng khác (Replay Attack Prevention)',
        });
      }
    }

    // Đối chiếu số tiền chuyển khoản
    const transferredAmount = Number(amount) || 0;
    if (transferredAmount > 0 && transferredAmount < order.amount) {
      order.adminNote = `[Cảnh báo Thiếu tiền] Số tiền chuyển ${transferredAmount} nhỏ hơn giá đơn hàng ${order.amount}`;
      await order.save();
      return res.status(400).json({
        status: 'error',
        message: 'Số tiền chuyển khoản không đủ để thanh toán đơn hàng này',
      });
    }

    // Phân loại ghi chú thanh toán (Khớp đủ vs Chuyển dư vs Quá hạn)
    let paymentNote = 'Xác thực tự động thành công qua Bank Webhook';
    if (transferredAmount > order.amount) {
      paymentNote = `Xác thực tự động thành công qua Bank Webhook. Học viên chuyển dư ${(transferredAmount - order.amount).toLocaleString('vi-VN')} VND (Cần kiểm tra đối soát/hoàn tiền)`;
    } else if (order.status === 'expired' || (order.expiresAt && order.expiresAt < new Date())) {
      paymentNote = 'Đơn hàng quá hạn đã được thanh toán và kích hoạt tự động qua webhook ngân hàng';
    }

    // Nguyên tử hóa cập nhật trạng thái (Atomic Update) ngăn Race Condition khi nhiều webhook đến cùng lúc
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: { $ne: 'paid' } },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
          bankTransactionId: transactionId || order.bankTransactionId || `BANK-${Date.now()}`,
          adminNote: paymentNote,
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      // Một tiến trình đồng thời khác đã chuyển sang paid trước
      return res.status(200).json({ received: true, message: 'Đơn hàng đã được thanh toán bởi tiến trình đồng thời' });
    }

    // Tự động kích hoạt Enrollment
    try {
      await enrollmentService.enrollCourse(updatedOrder.course, { id: updatedOrder.user, _id: updatedOrder.user }, {
        isFromPayment: true,
        existingOrderId: updatedOrder._id,
      });
    } catch (enrollErr) {
      console.error('[Bank Webhook] Auto-enrollment error:', enrollErr.message);
    }

    // Ghi AuditLog
    await AuditLog.create({
      actor: null,
      action: 'BANK_WEBHOOK_PAYMENT_SUCCESS',
      targetModel: 'Order',
      targetId: updatedOrder._id,
      details: {
        orderCode: updatedOrder.orderCode,
        amount: updatedOrder.amount,
        transferredAmount,
        bankTransactionId: updatedOrder.bankTransactionId,
      },
    }).catch(() => {});

    // Gửi thông báo cho học viên
    await notificationService.createNotification({
      recipient: updatedOrder.user,
      title: 'Thanh toán khóa học thành công!',
      message: `Đơn hàng ${updatedOrder.orderCode || ''} đã được xác nhận thanh toán tự động qua Ngân hàng. Chúc bạn học tốt!`,
      type: 'course',
      link: `/courses/${updatedOrder.course}/learn`,
    }).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Xác thực thanh toán và kích hoạt ghi danh thành công',
      data: {
        orderId: updatedOrder._id,
        orderCode: updatedOrder.orderCode,
      },
    });
  });

  // ==================================================
  // 7. ADMIN: VERIFY ORDER (DUYỆT THANH TOÁN THỦ CÔNG)
  // ==================================================
  adminVerifyOrder = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const { bankTransactionId, adminNote } = req.body;

    const order = await Order.findById(orderId).populate('course');
    if (!order) {
      return next(new AppError('Không tìm thấy đơn hàng này', 404));
    }

    if (order.status === 'paid') {
      return next(new AppError('Đơn hàng này đã được xác nhận thanh toán rồi!', 400));
    }

    // Kiểm tra bankTransactionId trùng lặp nếu admin nhập
    if (bankTransactionId) {
      const existingPaidOrderWithTx = await Order.findOne({
        bankTransactionId: String(bankTransactionId).trim(),
        status: 'paid',
        _id: { $ne: order._id },
      });
      if (existingPaidOrderWithTx) {
        return next(new AppError('Mã giao dịch ngân hàng này đã được sử dụng cho một đơn hàng khác!', 400));
      }
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: { $ne: 'paid' } },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
          verifiedBy: req.user._id,
          bankTransactionId: bankTransactionId || order.bankTransactionId || `ADMIN-MANUAL-${Date.now()}`,
          adminNote: adminNote || `Duyệt thủ công bởi Admin ${req.user.name || req.user.email}`,
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      return next(new AppError('Đơn hàng đã được thanh toán bởi một tiến trình khác', 400));
    }

    // Tự động kích hoạt Enrollment
    await enrollmentService.enrollCourse(updatedOrder.course._id || updatedOrder.course, { id: updatedOrder.user, _id: updatedOrder.user }, {
      isFromPayment: true,
      existingOrderId: updatedOrder._id,
    });

    // Ghi AuditLog
    await AuditLog.create({
      actor: req.user._id,
      action: 'ADMIN_PAYMENT_VERIFIED',
      targetModel: 'Order',
      targetId: updatedOrder._id,
      details: {
        orderCode: updatedOrder.orderCode,
        amount: updatedOrder.amount,
        bankTransactionId: updatedOrder.bankTransactionId,
      },
    }).catch(() => {});

    // Gửi thông báo cho học viên
    const courseTitle = order.course?.title ? getLocalizedText(order.course.title, 'vi') : 'khóa học';
    await notificationService.createNotification({
      recipient: updatedOrder.user,
      title: 'Thanh toán thành công!',
      message: `Đơn hàng ${updatedOrder.orderCode || ''} cho khóa học "${courseTitle}" đã được duyệt thành công. Chúc bạn học tốt!`,
      type: 'course',
      link: `/courses/${order.course._id || order.course}/learn`,
    }).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Đã xác nhận thanh toán và cấp quyền học cho học viên thành công!',
      data: { order: updatedOrder },
    });
  });

  // ==================================================
  // 8. ADMIN: REJECT ORDER (TỪ CHỐI ĐƠN HÀNG)
  // ==================================================
  adminRejectOrder = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId).populate('course');
    if (!order) {
      return next(new AppError('Không tìm thấy đơn hàng này', 404));
    }

    if (order.status === 'paid') {
      return next(new AppError('Không thể từ chối đơn hàng đã thanh toán thành công!', 400));
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: { $ne: 'paid' } },
      {
        $set: {
          status: 'cancelled',
          adminNote: reason || 'Từ chối bởi Quản trị viên (Không nhận được tiền)',
          verifiedBy: req.user._id,
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      return next(new AppError('Không thể từ chối đơn hàng đã thanh toán thành công!', 400));
    }

    // Ghi AuditLog
    await AuditLog.create({
      actor: req.user._id,
      action: 'ADMIN_PAYMENT_REJECTED',
      targetModel: 'Order',
      targetId: updatedOrder._id,
      details: {
        orderCode: updatedOrder.orderCode,
        reason: updatedOrder.adminNote,
      },
    }).catch(() => {});

    // Gửi thông báo cho học viên
    const courseTitle = order.course?.title ? getLocalizedText(order.course.title, 'vi') : 'khóa học';
    await notificationService.createNotification({
      recipient: updatedOrder.user,
      title: 'Đơn hàng thanh toán bị từ chối',
      message: `Đơn hàng ${updatedOrder.orderCode || ''} cho khóa học "${courseTitle}" không thể hoàn tất. Lý do: ${updatedOrder.adminNote}`,
      type: 'system',
      link: `/checkout/${order.course._id || order.course}`,
    }).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Đã từ chối đơn hàng thành công.',
      data: { order: updatedOrder },
    });
  });

  // ==================================================
  // 9. CONTROLLED DEMO SIMULATION (TRÌNH CHIẾU ĐỒ ÁN)
  // ==================================================
  demoSimulatePayment = catchAsync(async (req, res, next) => {
    // Chỉ Quản trị viên hoặc trong môi trường Test/Dev Sandbox có cờ ENABLE_MOCK_PAYMENTS
    const isDevSandbox = process.env.ENABLE_MOCK_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production';
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isAdmin && !isDevSandbox) {
      return next(new AppError('Chức năng giả lập thanh toán chỉ khả dụng trong môi trường Sandbox/Development hoặc dành riêng cho Quản trị viên.', 403));
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('course');
    if (!order) {
      return next(new AppError('Không tìm thấy đơn hàng này', 404));
    }

    if (order.user.toString() !== req.user._id.toString() && !isAdmin) {
      return next(new AppError('Bạn không thể thao tác trên đơn hàng của người khác', 403));
    }

    if (order.status === 'paid') {
      return res.status(200).json({
        status: 'success',
        message: 'Đơn hàng đã được thanh toán.',
        data: { order },
      });
    }

    order.status = 'paid';
    order.paidAt = new Date();
    order.bankTransactionId = `DEMO-SANDBOX-${Date.now()}`;
    order.adminNote = `[DEMO SIMULATE] Giao dịch thử nghiệm trình chiếu đồ án - Không có tiền thực tế (Bởi ${req.user.name || req.user.email})`;
    await order.save();

    // Auto enroll
    await enrollmentService.enrollCourse(order.course._id || order.course, { id: order.user, _id: order.user }, {
      isFromPayment: true,
      existingOrderId: order._id,
    });

    // Audit log
    await AuditLog.create({
      actor: req.user._id,
      action: 'DEMO_PAYMENT_SIMULATED',
      targetModel: 'Order',
      targetId: order._id,
      details: {
        orderCode: order.orderCode,
        amount: order.amount,
      },
    }).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: '[Demo Mode] Giả lập nhận tiền thành công! Học viên đã được kích hoạt khóa học.',
      data: { order },
    });
  });

  // ==================================================
  // 10. BACKWARD-COMPATIBLE WRAPPER: confirmQRPayment
  // ==================================================
  confirmQRPayment = catchAsync(async (req, res, next) => {
    const isMockAllowed = process.env.ENABLE_MOCK_PAYMENTS === 'true' || process.env.NODE_ENV !== 'production';
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isMockAllowed) {
      return next(new AppError('Xác nhận thanh toán tự động phía client bị vô hiệu hóa trong môi trường Production. Cần xác thực qua Webhook ngân hàng hoặc duyệt bởi Quản trị viên.', 403));
    }

    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('Không tìm thấy khóa học này', 404));
    }

    const amount = Number(course.price) || 0;

    // Tìm order pending gần nhất
    let order = await Order.findOne({ user: req.user._id, course: course._id, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 });

    if (order) {
      order.status = 'paid';
      order.amount = amount;
      order.paidAt = new Date();
      order.adminNote = '[Legacy Confirm] Xác nhận thanh toán';
      await order.save();
    } else {
      const orderCode = await generateUniqueOrderCode();
      order = await Order.create({
        user: req.user._id,
        course: course._id,
        orderCode,
        amount,
        currency: 'vnd',
        paymentMethod: 'vietqr',
        transferContent: `EL ${orderCode}`,
        status: 'paid',
        paidAt: new Date(),
        adminNote: '[Legacy Confirm] Tự động tạo và xác nhận',
      });
    }

    await enrollmentService.enrollCourse(courseId, req.user, {
      isFromPayment: true,
      existingOrderId: order._id,
    });

    res.status(200).json({
      status: 'success',
      message: 'Thanh toán thành công! Bạn đã được đăng ký vào khóa học.',
      data: { order },
    });
  });
}

module.exports = new PaymentController();
