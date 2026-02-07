const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000, default: '' },
    location: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    amenities: [{ type: String, trim: true }],
    images: [{ type: String }], // URL strings
    featureImage: { type: String, default: '' }, // URL of the featured image
    collaborationTypes: [{
      type: String,
      enum: ['free_stay', 'discount_stay', 'paid_collaboration'],
    }],
    availability: {
      status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    contactEmail: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hotelSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
