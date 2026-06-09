const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Goal = require('../models/Goal');
const { auth } = require('../../../../middleware/auth');
const { asyncHandler } = require('../../../../middleware/asyncHandler');
const { httpError } = require('../../../../middleware/errorHandler');
const { validate } = require('../../../../middleware/validate');
const { shapeGoal, shapeGoals } = require('../../../shared/responseShapers');

// All routes require user auth
router.use(auth);

// ── GET /api/goals ─────────────────────────────────────────────────────────────
// Fetch all goals for the logged-in user
router.get('/', asyncHandler(async (req, res) => {
  const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(shapeGoals(goals));
}));

// ── POST /api/goals ────────────────────────────────────────────────────────────
// Create a new goal
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('category').optional().isIn(['mental_health', 'fitness', 'social', 'academic', 'self_care', 'sleep', 'other']),
], validate, asyncHandler(async (req, res) => {
  const { title, description, category, targetDate, milestones } = req.body;

  const goal = new Goal({
    userId: req.user.id,
    title,
    description,
    category: category || 'mental_health',
    targetDate: targetDate || null,
    milestones: (milestones || []).map(m => ({ label: m, completed: false })),
  });

  await goal.save();
  res.status(201).json(shapeGoal(goal));
}));

// ── PATCH /api/goals/:id/progress ─────────────────────────────────────────────
// Update the progress % of a goal (0-100)
router.patch('/:id/progress', asyncHandler(async (req, res) => {
  const { progress } = req.body;
  if (progress === undefined || progress < 0 || progress > 100) {
    throw httpError(400, 'Progress must be between 0 and 100', 'VALIDATION_ERROR');
  }
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
  if (!goal) throw httpError(404, 'Goal not found', 'GOAL_NOT_FOUND');

  goal.progress = progress;
  if (progress >= 100) goal.status = 'completed';
  await goal.save();

  res.json(shapeGoal(goal));
}));

// ── PATCH /api/goals/:id/milestone/:mid ───────────────────────────────────────
// Toggle a milestone complete / incomplete
router.patch('/:id/milestone/:mid', asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
  if (!goal) throw httpError(404, 'Goal not found', 'GOAL_NOT_FOUND');

  const ms = goal.milestones.id(req.params.mid);
  if (!ms) throw httpError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND');

  ms.completed = !ms.completed;
  ms.completedAt = ms.completed ? new Date() : undefined;

  // Auto-recalculate progress from milestones
  const done = goal.milestones.filter(m => m.completed).length;
  goal.progress = goal.milestones.length > 0
    ? Math.round((done / goal.milestones.length) * 100)
    : goal.progress;

  await goal.save();
  res.json(shapeGoal(goal));
}));

// ── PATCH /api/goals/:id/status ───────────────────────────────────────────────
// Pause or reactivate a goal
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'paused', 'completed'].includes(status)) {
    throw httpError(400, 'Invalid status', 'VALIDATION_ERROR');
  }
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { status },
    { new: true }
  );
  if (!goal) throw httpError(404, 'Goal not found', 'GOAL_NOT_FOUND');
  res.json(shapeGoal(goal));
}));

// ── DELETE /api/goals/:id ─────────────────────────────────────────────────────
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!result) throw httpError(404, 'Goal not found', 'GOAL_NOT_FOUND');
  res.json({ success: true });
}));

module.exports = router;
