const mongoose = require('mongoose');

/**
 * Badge — represents a milestone achievement earned by a user.
 *
 * Badge keys and their unlock conditions:
 *  - first_checkin     : First mood logged ever
 *  - week_warrior      : 7-day streak
 *  - fortnight_focus   : 14-day streak
 *  - monthly_master    : 30-day streak
 *  - mood_explorer     : 10 total check-ins
 *  - consistent_50     : 50 total check-ins
 *  - centurion         : 100 total check-ins
 */
const BADGE_KEYS = [
  'first_checkin',
  'week_warrior',
  'fortnight_focus',
  'monthly_master',
  'mood_explorer',
  'consistent_50',
  'centurion',
];

const BadgeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    badgeKey: {
      type: String,
      enum: BADGE_KEYS,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    seen: {
      type: Boolean,
      default: false,  // false = notification dot should appear
    },
  },
  { timestamps: true }
);

// Composite index: a user can only earn each badge once
BadgeSchema.index({ user: 1, badgeKey: 1 }, { unique: true });

module.exports = mongoose.model('Badge', BadgeSchema);
module.exports.BADGE_KEYS = BADGE_KEYS;
