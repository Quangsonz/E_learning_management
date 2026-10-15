const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { protect: auth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate.middleware');
const paymentValidation = require('../validations/payment.validation');

const router = express.Router();

// 1. Bank Webhook (Công khai đón nhận biến động số dư, xác thực bằng Secret Key)
router.post('/bank-webhook', paymentController.bankWebhook);

// 2. Stripe Checkout Intent
router.post('/create-payment-intent', auth, paymentController.createPaymentIntent);

// 3. VietQR: Tạo đơn hàng và mã QR
router.post('/create-qr-order', auth, validate(paymentValidation.createQROrder), paymentController.createQROrder);

// 4. Tra cứu trạng thái đơn hàng (Real-time polling)
router.get('/orders/:orderId', auth, validate(paymentValidation.getOrderStatus), paymentController.getOrderStatus);

// 5. Học viên xác nhận đã chuyển khoản (chuyển sang pending_verification)
router.post('/orders/:orderId/confirm-transfer', auth, validate(paymentValidation.confirmTransfer), paymentController.confirmTransfer);

// 6. Chế độ Giả lập an toàn cho Trình chiếu Đồ án (Sandbox/Admin)
router.post('/demo-simulate', auth, validate(paymentValidation.demoSimulatePayment), paymentController.demoSimulatePayment);

// 7. Endpoint cũ (Tương thích ngược)
router.post('/confirm-qr-payment', auth, paymentController.confirmQRPayment);

// 8. Quản trị viên đối soát & duyệt đơn hàng chuyển khoản
router.patch('/admin/orders/:orderId/verify', auth, requireRole('admin'), validate(paymentValidation.adminVerifyOrder), paymentController.adminVerifyOrder);
router.patch('/admin/orders/:orderId/reject', auth, requireRole('admin'), validate(paymentValidation.adminRejectOrder), paymentController.adminRejectOrder);

module.exports = router;
