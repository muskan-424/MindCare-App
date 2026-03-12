const express = require('express');
const router = express.Router();
const JournalEntry = require('../models/JournalEntry');

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.json([]);
    }
    const entries = await JournalEntry.find({ user: userId })
      .sort({ date: -1 })
      .limit(100)
      .lean();
    res.json(
      entries.map((e) => ({
        id: e._id,
        date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        content: e.content,
      }))
    );
  } catch (err) {
    console.error('Error fetching journals:', err.message);
    res.status(500).json({ error: 'Failed to load journals' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content || typeof content !== 'string') {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    const entry = new JournalEntry({ user: userId, content: content.trim() });
    await entry.save();
    res.json({
      id: entry._id,
      date: new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      content: entry.content,
    });
  } catch (err) {
    console.error('Error creating journal:', err.message);
    res.status(500).json({ error: 'Failed to save journal' });
  }
});

module.exports = router;
