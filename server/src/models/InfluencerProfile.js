const mongoose = require('mongoose');

const influencerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, trim: true, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    niche: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    collaborationTypes: {
      type: [{ type: String, enum: ['free_stay', 'discount_stay', 'paid_collaboration'] }],
      default: [],
    },
    linkedPlatforms: [
      {
        provider: { type: String, enum: ['youtube', 'instagram', 'tiktok'] },
        providerUserId: { type: String },
        username: { type: String },
        followers: { type: Number, default: 0 },
        linkedAt: { type: Date, default: Date.now },
      },
    ],
    portfolio: [
      {
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        fileType: { type: String, enum: ['image', 'video', 'pdf', 'other'], required: true },
        mimeType: { type: String },
        size: { type: Number },
        title: { type: String, trim: true, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('InfluencerProfile', influencerProfileSchema);
