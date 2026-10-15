const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    orderCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['vietqr', 'stripe', 'free'],
      default: 'vietqr',
    },
    transferContent: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    bankTransactionId: {
      type: String,
      trim: true,
    },
    adminNote: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'pending_verification', 'paid', 'failed', 'expired', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups during webhooks, status polling, and user queries
orderSchema.index({ user: 1, course: 1, status: 1 });
orderSchema.index({ transferContent: 1 }, { sparse: true });
orderSchema.index({ bankTransactionId: 1 }, { sparse: true });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ expiresAt: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
