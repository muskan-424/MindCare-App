const express = require('express');
const router = express.Router();
const HomeConfig = require('../models/HomeConfig');

const SEED_SELF_HELP = [
  { id: 'Breathing', screen: 'Breathing', label: 'Breathing', icon: 'https://cdn-icons-png.flaticon.com/512/4151/4151607.png', order: 0, active: true },
  { id: 'Affirmations', screen: 'Affirmations', label: 'Affirmations', icon: 'https://cdn-icons-png.flaticon.com/512/2461/2461102.png', order: 1, active: true },
  { id: 'CrisisResources', screen: 'CrisisResources', label: 'Crisis support', icon: 'https://cdn-icons-png.flaticon.com/512/463/463574.png', order: 2, active: true },
  { id: 'MoodCheck', screen: 'MoodCheck', label: 'Mood check', icon: 'https://cdn-icons-png.flaticon.com/512/1874/1874325.png', order: 3, active: true },
  { id: 'Gratitude', screen: 'Gratitude', label: 'Gratitude', icon: 'https://cdn-icons-png.flaticon.com/512/4207/4207244.png', order: 4, active: true },
  { id: 'Grounding', screen: 'Grounding', label: 'Grounding', icon: 'https://cdn-icons-png.flaticon.com/512/609/609803.png', order: 5, active: true },
];

const SEED_CONTENT_CATEGORIES = [
  { id: 'meditation', label: 'Meditation', order: 0, active: true },
  { id: 'motivation', label: 'Motivation', order: 1, active: true },
  { id: 'sleep', label: 'Sleep Stories', order: 2, active: true },
  { id: 'relaxing_music', label: 'Relaxing Music', order: 3, active: true },
  { id: 'therapy', label: 'Therapy Advice', order: 4, active: true },
];

async function ensureSeeded() {
  const existing = await HomeConfig.findOne({ key: 'default' });
  if (existing) return;
  await HomeConfig.create({
    key: 'default',
    selfHelpTiles: SEED_SELF_HELP,
    contentCategories: SEED_CONTENT_CATEGORIES,
  });
}

// GET /api/home — home screen config (self-help tiles, content categories)
router.get('/', async (_req, res) => {
  try {
    await ensureSeeded();
    const doc = await HomeConfig.findOne({ key: 'default' }).lean();
    if (!doc) {
      return res.json({
        selfHelpTiles: SEED_SELF_HELP,
        contentCategories: SEED_CONTENT_CATEGORIES,
      });
    }
    const selfHelpTiles = (doc.selfHelpTiles || []).filter(t => t.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const contentCategories = (doc.contentCategories || []).filter(c => c.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json({ selfHelpTiles, contentCategories });
  } catch (err) {
    console.error('Error fetching home config:', err.message);
    res.status(500).json({
      selfHelpTiles: SEED_SELF_HELP,
      contentCategories: SEED_CONTENT_CATEGORIES,
    });
  }
});

module.exports = router;
