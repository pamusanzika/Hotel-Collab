const mongoose = require('mongoose');

const hotelOwnerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    website: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HotelOwnerProfile', hotelOwnerProfileSchema);
