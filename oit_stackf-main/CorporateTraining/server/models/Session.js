const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activeSessionId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: {
      type: String,
      default: 'Unknown Device',
    },
    ipAddress: {
      type: String,
      default: 'Unknown IP',
    },
    refreshToken: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index to automatically delete expired sessions from the database
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
