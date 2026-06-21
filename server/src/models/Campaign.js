const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorRole: {
      type: String,
      enum: ['hotel_owner', 'influencer'],
      required: true,
    },
    campaignType: {
      type: String,
      enum: ['free_stay', 'paid_collaboration', 'discount_stay'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'upcoming', 'ongoing', 'done', 'cancelled', 'rejected'],
      default: 'pending',
    },
    cancelReason: {
      type: String,
      maxlength: 500,
      default: '',
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'requires_payment', 'processing', 'paid', 'refunded', 'failed'],
      default: 'not_required',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  { timestamps: true }
);

campaignSchema.index({ hotelId: 1, status: 1 });
campaignSchema.index({ influencerId: 1, status: 1 });
campaignSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
