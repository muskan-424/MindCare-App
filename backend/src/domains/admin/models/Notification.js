const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: ['all_users', 'therapists'],
      required: true,
    },
    sentBy: {
      type: String,
      default: 'admin',
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    /** Cached translations keyed by locale code (e.g. hi.title, hi.body). */
    translations: {
      type: Map,
      of: {
        title: { type: String, trim: true },
        body: { type: String, trim: true },
      },
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

// Fetch notifications by audience sorted by newest first
NotificationSchema.index({ audience: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days to prevent storage bloat
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Notification', NotificationSchema);
