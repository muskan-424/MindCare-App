const express = require('express');
const router = express.Router();
const MoodEntry = require('../models/MoodEntry');

router.post('/', async (req, res) => {
  try {
    const { userId, rating, note } = req.body;
    if (!userId || rating == null) {
      return res.status(400).json({ error: 'userId and rating are required' });
    }
    const r = Math.max(1, Math.min(10, Number(rating)));
    const entry = new MoodEntry({ user: userId, rating: r, note: note || '' });
    await entry.save();
    res.json({ id: entry._id, date: entry.date, rating: entry.rating });
  } catch (err) {
    console.error('Mood log error:', err.message);
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

router.get('/trend', async (req, res) => {
  try {
    const { userId, window } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const days = window === '30' ? 30 : 7;
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

// GET /api/mood/today?userId=... — whether the user has logged mood today (for daily auto check-in)
router.get('/today', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
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

module.exports = router;
