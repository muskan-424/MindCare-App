const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MoodEntry = require('../models/MoodEntry');
const UserStreak = require('../models/UserStreak');
const Badge = require('../models/Badge');
const { auth } = require('../../../../middleware/auth');
const { evaluateBurnoutRisk } = require('../../therapy/services/burnoutPredictionService');

// Badge thresholds: [badgeKey, streakRequired, totalCheckinsRequired]
const BADGE_THRESHOLDS = [
  { key: 'first_checkin',   streak: null, checkins: 1  },
  { key: 'week_warrior',    streak: 7,    checkins: null },
  { key: 'fortnight_focus', streak: 14,   checkins: null },
  { key: 'monthly_master',  streak: 30,   checkins: null },
  { key: 'mood_explorer',   streak: null, checkins: 10 },
  { key: 'consistent_50',   streak: null, checkins: 50 },
  { key: 'centurion',       streak: null, checkins: 100 },
];

/**
 * processStreak(userId)
 * Updates the user's streak document and checks/awards badges.
 * Returns { currentStreak, longestStreak, totalCheckins, newBadge }
 */
async function processStreak(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streakDoc = await UserStreak.findOne({ user: userId });
  let newBadgeKey = null;

  if (!streakDoc) {
    // First ever check-in
    streakDoc = await UserStreak.create({
      user: userId,
      currentStreak: 1,
      longestStreak: 1,
      lastCheckinDate: today,
      totalCheckins: 1,
    });
  } else {
    const last = new Date(streakDoc.lastCheckinDate);
    last.setHours(0, 0, 0, 0);
    const dayDiff = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      // Already checked in today — no streak change, but still check badges
    } else if (dayDiff === 1) {
      // Consecutive day — extend streak
      streakDoc.currentStreak += 1;
      streakDoc.totalCheckins += 1;
      streakDoc.lastCheckinDate = today;
      if (streakDoc.currentStreak > streakDoc.longestStreak) {
        streakDoc.longestStreak = streakDoc.currentStreak;
      }
    } else {
      // Gap — reset streak
      streakDoc.currentStreak = 1;
      streakDoc.totalCheckins += 1;
      streakDoc.lastCheckinDate = today;
    }
    await streakDoc.save();
  }

  // Check badge thresholds
  for (const threshold of BADGE_THRESHOLDS) {
    const streakMet = threshold.streak === null || streakDoc.currentStreak >= threshold.streak;
    const checkinMet = threshold.checkins === null || streakDoc.totalCheckins >= threshold.checkins;
    if (streakMet && checkinMet) {
      try {
        // insertOne with unique index — silently ignores if already earned
        const badge = await Badge.create({ user: userId, badgeKey: threshold.key });
        if (badge) newBadgeKey = threshold.key;  // newly created = just earned
      } catch (e) {
        // Duplicate key = already earned, skip
        if (e.code !== 11000) console.warn('Badge award error:', e.message);
      }
    }
  }

  return {
    currentStreak: streakDoc.currentStreak,
    longestStreak: streakDoc.longestStreak,
    totalCheckins: streakDoc.totalCheckins,
    newBadge: newBadgeKey,
  };
}

// POST /api/mood — log a mood entry
router.post(
  '/',
  auth,
  [
    body('rating', 'rating must be an integer between 1 and 10')
      .isInt({ min: 1, max: 10 }),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Mood note cannot exceed 500 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { rating, note } = req.body;
      const userId = req.user.id;
      const r = Math.max(1, Math.min(10, Number(rating)));
      const entry = new MoodEntry({ user: userId, rating: r, note: note || '' });
      await entry.save();

      // Process streak and badge awards (non-blocking on error)
      const streakData = await processStreak(userId).catch(e => {
        console.error('Streak processing error:', e.message);
        return { currentStreak: 0, longestStreak: 0, totalCheckins: 0, newBadge: null };
      });

      // Asynchronously trigger advanced burnout prediction logic
      evaluateBurnoutRisk(userId).catch(e => console.error('Burnout Trigger Error:', e.message));

      res.json({
        id: entry._id,
        date: entry.date,
        rating: entry.rating,
        streak: streakData.currentStreak,
        newBadge: streakData.newBadge,
      });
    } catch (err) {
      console.error('Mood log error:', err.message);
      res.status(500).json({ error: 'Failed to save mood' });
    }
  }
);

// GET /api/mood/trend?window=7|30|90 — mood trend for charts
router.get('/trend', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let days = 7;
    if (req.query.window === '30') days = 30;
    if (req.query.window === '90') days = 90;
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const entries = await MoodEntry.find({ user: userId, date: { $gte: start } })
      .sort({ date: 1 })
      .lean();

    const byDay = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { date: key, rating: null, note: '', count: 0 };
    }
    entries.forEach((e) => {
      const key = new Date(e.date).toISOString().slice(0, 10);
      if (byDay[key]) {
        byDay[key].rating = byDay[key].rating == null ? e.rating : (byDay[key].rating + e.rating) / 2;
        byDay[key].note = e.note || byDay[key].note;
        byDay[key].count += 1;
      }
    });

    const trend = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    res.json({ trend, days });
  } catch (err) {
    console.error('Mood trend error:', err.message);
    res.status(500).json({ error: 'Failed to get trend' });
  }
});

// GET /api/mood/today — whether user has logged mood today
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const entry = await MoodEntry.findOne({ user: userId, date: { $gte: startOfToday } })
      .sort({ date: -1 })
      .lean();
    res.json({
      loggedToday: !!entry,
      entry: entry ? { date: entry.date, rating: entry.rating, note: entry.note } : null,
    });
  } catch (err) {
    console.error('Mood today check error:', err.message);
    res.status(500).json({ loggedToday: false, entry: null });
  }
});

// GET /api/mood/stats — summary stats (average, streak, best/worst day)
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const entries = await MoodEntry.find({ user: userId, date: { $gte: thirtyDaysAgo } })
      .sort({ date: -1 })
      .lean();

    if (!entries.length) {
      return res.json({ average: null, streak: 0, bestDay: null, worstDay: null, totalEntries: 0 });
    }

    const ratings = entries.map(e => e.rating);
    const average = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);

    const best = entries.reduce((a, b) => a.rating >= b.rating ? a : b);
    const worst = entries.reduce((a, b) => a.rating <= b.rating ? a : b);

    // Calculate current streak (consecutive days with at least 1 entry)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const logged = entries.some(e => new Date(e.date).toISOString().slice(0, 10) === key);
      if (logged) streak++;
      else break;
    }

    res.json({
      average: Number(average),
      streak,
      bestDay: { date: best.date, rating: best.rating, note: best.note },
      worstDay: { date: worst.date, rating: worst.rating, note: worst.note },
      totalEntries: entries.length,
    });
  } catch (err) {
    console.error('Mood stats error:', err.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// DELETE /api/mood/:id — delete a mood entry (user can only delete own entries)
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await MoodEntry.findOne({ _id: req.params.id, user: req.user.id });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    await entry.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error('Mood delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete mood' });
  }
});

module.exports = router;
