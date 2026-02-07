const mongoose = require('mongoose');

/**
 * Stores OAuth tokens separately from profile data for security.
 * Tokens are encrypted at rest in production (use mongoose-encryption or similar).
 */
const socialAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['youtube', 'instagram', 'tiktok'], required: true },
    providerUserId: { type: String, required: true },
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    scopes: [{ type: String }],
    expiresAt: { type: Date, default: null },
    tokenStrategy: {
      type: String,
      enum: ['oauth2', 'mock'],
      default: 'oauth2',
    },
  },
  { timestamps: true }
);

socialAccountSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', socialAccountSchema);
