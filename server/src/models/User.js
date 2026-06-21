const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['guest', 'hotel_owner', 'influencer', 'admin'],
      default: 'guest',
    },
    status: {
      type: String,
      enum: ['active', 'banned', 'pending_verification'],
      default: 'pending_verification',
    },
    isEmailVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
