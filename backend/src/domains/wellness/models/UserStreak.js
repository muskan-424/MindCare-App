const mongoose = require('mongoose');

/**
 * UserStreak — tracks daily check-in streaks for a user.
 * A streak increments when a user logs a mood entry on consecutive days.
 * It resets to 1 if a day is skipped (more than 1 day gap since lastCheckinDate).
 */
const UserStreakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,  // one streak document per user
    },
    currentStreak: {
      type: Number,
      default: 1,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 1,
      min: 0,
    },
    lastCheckinDate: {
      type: Date,
      default: Date.now,
    },
    totalCheckins: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserStreak', UserStreakSchema);
