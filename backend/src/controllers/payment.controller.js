const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('../models/Order');
const Course = require('../models/Course');
const enrollmentService = require('../services/enrollment.service');

class PaymentController {
  createPaymentIntent = catchAsync(async (req, res, next) => {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Default to $50 if price not set for MVP testing
    const amount = course.price ? course.price * 100 : 5000; 

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
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
      // Note: req.body must be raw string/buffer for Stripe signature verification.
      // This requires setting up express.raw() in the route before json parsing.
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
          await enrollmentService.enrollCourse(courseId, { _id: userId });
        } catch (err) {
          console.error('Failed to enroll after payment:', err);
        }
      }
    }

    res.status(200).json({ received: true });
  });
}

module.exports = new PaymentController();
