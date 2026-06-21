const mongoose = require('mongoose');

const collabOpportunitySchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      maxlength: 3000,
      default: '',
    },
    eventType: {
      type: String,
      enum: [
        'grand_opening',
        'seasonal_event',
        'festival',
        'product_launch',
        'anniversary',
        'holiday_special',
        'food_wine',
        'wellness_retreat',
        'other',
      ],
      required: true,
    },
    compensationType: {
      type: String,
      enum: ['free_stay', 'paid', 'commission', 'discount_stay', 'mixed'],
      required: true,
    },
    compensationDetails: {
      type: String,
      maxlength: 500,
      default: '',
    },
    eventStartDate: {
      type: Date,
      required: true,
    },
    eventEndDate: {
      type: Date,
      required: true,
    },
    applicationDeadline: {
      type: Date,
      required: true,
    },
    requirements: {
      minFollowers: { type: Number, min: 0, default: 0 },
      niches: [{ type: String, trim: true }],
      deliverables: { type: String, maxlength: 1000, default: '' },
    },
    maxApplicants: {
      type: Number,
      min: 1,
      default: 10,
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['open', 'closed', 'banned'],
      default: 'open',
    },
    banReason: {
      type: String,
      maxlength: 500,
      default: '',
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    applicants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, maxlength: 500, default: '' },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

collabOpportunitySchema.index({ hotelId: 1, status: 1 });
collabOpportunitySchema.index({ createdBy: 1 });
collabOpportunitySchema.index({ status: 1, applicationDeadline: 1 });

module.exports = mongoose.model('CollabOpportunity', collabOpportunitySchema);
