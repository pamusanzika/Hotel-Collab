const mongoose = require('mongoose');

const banLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['ban', 'unban'], required: true },
  reason: { type: String, maxlength: 500, default: '' },
  timestamp: { type: Date, default: Date.now },
});

banLogSchema.index({ userId: 1 });

module.exports = mongoose.model('BanLog', banLogSchema);
