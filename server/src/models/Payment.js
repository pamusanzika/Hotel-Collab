const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    stripeClientSecret: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'requires_payment', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    refundId: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ campaignId: 1 });
paymentSchema.index({ payerId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
