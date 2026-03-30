const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { auth } = require('../middleware/auth');

// All routes require user auth
router.use(auth);

// ── GET /api/goals ─────────────────────────────────────────────────────────────
// Fetch all goals for the logged-in user
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// ── POST /api/goals ────────────────────────────────────────────────────────────
// Create a new goal
router.post('/', async (req, res) => {
  try {
    const { title, description, category, targetDate, milestones } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const goal = new Goal({
      userId: req.user.id,
      title,
      description,
      category: category || 'mental_health',
      targetDate: targetDate || null,
      milestones: (milestones || []).map(m => ({ label: m, completed: false })),
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// ── PATCH /api/goals/:id/progress ─────────────────────────────────────────────
// Update the progress % of a goal (0-100)
router.patch('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    goal.progress = progress;
    if (progress >= 100) goal.status = 'completed';
    await goal.save();

    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// ── PATCH /api/goals/:id/milestone/:mid ───────────────────────────────────────
// Toggle a milestone complete / incomplete
router.patch('/:id/milestone/:mid', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const ms = goal.milestones.id(req.params.mid);
    if (!ms) return res.status(404).json({ error: 'Milestone not found' });

    ms.completed = !ms.completed;
    ms.completedAt = ms.completed ? new Date() : undefined;

    // Auto-recalculate progress from milestones
    const done = goal.milestones.filter(m => m.completed).length;
    goal.progress = goal.milestones.length > 0
      ? Math.round((done / goal.milestones.length) * 100)
      : goal.progress;

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle milestone' });
  }
});

// ── PATCH /api/goals/:id/status ───────────────────────────────────────────────
// Pause or reactivate a goal
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── DELETE /api/goals/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ error: 'Goal not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
