const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/Order');
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const enrollmentService = require('../services/enrollment.service');

class PaymentController {
  createPaymentIntent = catchAsync(async (req, res, next) => {
    if (!stripe) {
      return next(new AppError('Stripe API key is not configured on the server.', 500));
    }

    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    const amount = Math.round((course.price || 0) * 100);
    if (amount <= 0) {
      return next(new AppError('Course is free or has invalid price. Please enroll directly.', 400));
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        courseId: course._id.toString(),
      },
    });

    // Create a pending Order
    await Order.create({
      user: req.user._id,
      course: course._id,
      amount: amount / 100, // stored in dollars
      currency: 'usd',
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
    });
  });

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
      const { userId, courseId } = paymentIntent.metadata;

      // Find order
      const order = await Order.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { status: 'paid' },
        { new: true }
      );

      if (order && userId && courseId) {
        // Auto enroll user
        try {
          await enrollmentService.enrollCourse(courseId, { id: userId, _id: userId });
        } catch (err) {
          console.error('[Stripe Webhook] Auto-enrollment failed:', err);
          await AuditLog.create({
            user: userId,
            action: 'PAYMENT_ENROLLMENT_FAILED',
            targetModel: 'Course',
            targetId: courseId,
            details: { paymentIntentId: paymentIntent.id, error: err.message }
          }).catch(() => {});
        }
      }
    }

    res.status(200).json({ received: true });
  });

  /**
   * POST /api/payments/create-qr-order
   * Tạo thông tin quét mã VietQR và đơn hàng chờ thanh toán
   */
  createQROrder = catchAsync(async (req, res, next) => {
    const { courseId, testAmount } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Không tìm thấy khóa học này', 404));
    }

    // Cho phép dùng số tiền thử nghiệm (ví dụ 1000đ) hoặc giá gốc của khóa học
    const amount = testAmount && Number(testAmount) > 0 ? Number(testAmount) : (Number(course.price) || 0);
    const transferContent = `EL${courseId.toString().slice(-6).toUpperCase()}${req.user._id.toString().slice(-4).toUpperCase()}`;
    
    const bankId = process.env.VIETQR_BANK_ID || 'MB';
    const bankAccount = process.env.VIETQR_ACCOUNT_NO || '0383888999';
    const accountName = process.env.VIETQR_ACCOUNT_NAME || 'HE THONG E LEARNING';
    const bankFullName = process.env.VIETQR_BANK_NAME || 'MBBank (Ngân hàng Quân Đội)';

    // Mã VietQR.io chuẩn NAPAS
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    // Tạo đơn hàng chờ
    let order = await Order.findOne({ user: req.user._id, course: course._id, status: 'pending' });
    if (!order) {
      order = await Order.create({
        user: req.user._id,
        course: course._id,
        amount: amount,
        currency: 'vnd',
        status: 'pending',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        orderId: order._id,
        qrUrl,
        bankInfo: {
          bankName: bankFullName,
          accountNumber: bankAccount,
          accountName: accountName,
          amount,
          transferContent
        }
      }
    });
  });

  /**
   * POST /api/payments/confirm-qr-payment
   * Xác nhận thanh toán mã QR -> Cập nhật Order paid & tự động ghi danh
   */
  confirmQRPayment = catchAsync(async (req, res, next) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Không tìm thấy khóa học này', 404));
    }

    const amount = Number(course.price) || 0;

    // Cập nhật hoặc tạo đơn hàng ở trạng thái paid
    let order = await Order.findOne({ user: req.user._id, course: course._id });
    if (order) {
      order.status = 'paid';
      order.amount = amount;
      await order.save();
    } else {
      order = await Order.create({
        user: req.user._id,
        course: course._id,
        amount: amount,
        currency: 'vnd',
        status: 'paid',
      });
    }

    // Tự động ghi danh vào khóa học
    await enrollmentService.enrollCourse(courseId, req.user);

    res.status(200).json({
      status: 'success',
      message: 'Thanh toán qua VietQR thành công! Bạn đã được đăng ký vào khóa học.',
      data: { order }
    });
  });
}

module.exports = new PaymentController();
