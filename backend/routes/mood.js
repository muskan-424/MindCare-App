const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');
const { auth } = require('../middleware/auth');

// POST /api/mood — log a mood entry
router.post('/', auth, async (req, res) => {
  try {
    const { rating, note } = req.body;
    const userId = req.user.id; // from JWT
    if (rating == null) return res.status(400).json({ error: 'rating is required' });
    const r = Math.max(1, Math.min(10, Number(rating)));
    const entry = new MoodEntry({ user: userId, rating: r, note: note || '' });
    await entry.save();
    res.json({ id: entry._id, date: entry.date, rating: entry.rating });
  } catch (err) {
    console.error('Mood log error:', err.message);
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

// GET /api/mood/trend?window=7|30 — mood trend for charts
router.get('/trend', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const days = req.query.window === '30' ? 30 : 7;
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
