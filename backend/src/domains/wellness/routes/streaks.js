const express = require('express');
const router = express.Router();
const { auth } = require('../../../../middleware/auth');
const UserStreak = require('../models/UserStreak');
const Badge = require('../models/Badge');

// ─── Badge metadata (label, icon name, color, description) ───────────────────
const BADGE_META = {
  first_checkin:   { label: 'First Step',       icon: 'star-shooting',      color: '#F59E0B', desc: 'Logged your first mood check-in' },
  week_warrior:    { label: 'Week Warrior',      icon: 'fire',               color: '#EF4444', desc: 'Maintained a 7-day streak' },
  fortnight_focus: { label: 'Fortnight Focus',   icon: 'calendar-check',     color: '#8B5CF6', desc: 'Maintained a 14-day streak' },
  monthly_master:  { label: 'Monthly Master',    icon: 'crown',              color: '#10B981', desc: 'Maintained a 30-day streak' },
  mood_explorer:   { label: 'Mood Explorer',     icon: 'compass',            color: '#3B82F6', desc: 'Logged 10 mood check-ins' },
  consistent_50:   { label: 'Consistent Mind',   icon: 'brain',              color: '#EC4899', desc: 'Logged 50 mood check-ins' },
  centurion:       { label: 'Centurion',         icon: 'shield-star',        color: '#F97316', desc: 'Logged 100 mood check-ins' },
};

// GET /api/streaks/me — return current streak, longest streak, checkins, and all badges
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const streak = await UserStreak.findOne({ user: userId }).lean();
    const badges = await Badge.find({ user: userId }).sort({ earnedAt: -1 }).lean();

    // Determine next badge threshold for progress indicator
    const streakThresholds = [
      { key: 'week_warrior', target: 7 },
      { key: 'fortnight_focus', target: 14 },
      { key: 'monthly_master', target: 30 },
    ];
    const checkinThresholds = [
      { key: 'first_checkin', target: 1 },
      { key: 'mood_explorer', target: 10 },
      { key: 'consistent_50', target: 50 },
      { key: 'centurion', target: 100 },
    ];

    const earnedKeys = new Set(badges.map(b => b.badgeKey));
    const currentStreak = streak?.currentStreak || 0;
    const totalCheckins = streak?.totalCheckins || 0;

    // Find next unlockable streak badge
    const nextStreakBadge = streakThresholds.find(t => !earnedKeys.has(t.key));
    // Find next unlockable checkin badge
    const nextCheckinBadge = checkinThresholds.find(t => !earnedKeys.has(t.key));

    res.json({
      currentStreak,
      longestStreak: streak?.longestStreak || 0,
      totalCheckins,
      lastCheckinDate: streak?.lastCheckinDate || null,
      badges: badges.map(b => ({
        key: b.badgeKey,
        earnedAt: b.earnedAt,
        seen: b.seen,
        ...BADGE_META[b.badgeKey],
      })),
      nextStreakGoal: nextStreakBadge
        ? { key: nextStreakBadge.key, target: nextStreakBadge.target, progress: currentStreak, ...BADGE_META[nextStreakBadge.key] }
        : null,
      nextCheckinGoal: nextCheckinBadge
        ? { key: nextCheckinBadge.key, target: nextCheckinBadge.target, progress: totalCheckins, ...BADGE_META[nextCheckinBadge.key] }
        : null,
    });
  } catch (err) {
    console.error('Streaks fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load streak data' });
  }
});

// PATCH /api/streaks/seen — mark all unseen badges as seen (clears notification dot)
router.patch('/seen', auth, async (req, res) => {
  try {
    await Badge.updateMany({ user: req.user.id, seen: false }, { $set: { seen: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark badges as seen' });
  }
});

module.exports = router;
module.exports.BADGE_META = BADGE_META;
