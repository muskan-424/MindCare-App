const express = require('express');
const router = express.Router();
const WellnessPlan = require('../models/WellnessPlan');
const { auth } = require('../middleware/auth');

// GET /api/wellness
// Retrieve the user's active (or awaiting) wellness plan
router.get('/', auth, async (req, res) => {
  try {
    const plan = await WellnessPlan.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (!plan) return res.json({ exists: false });

    res.json({
      exists: true,
      id: String(plan._id),
      status: plan.status,
      goals: plan.goals,
      adminNote: plan.adminNote,
      planFocus: plan.planFocus,
      dailyPlans: plan.dailyPlans || [],
      progress: plan.totalTasksCompleted || 0,
      createdAt: plan.createdAt,
    });
  } catch (err) {
    console.error('Get wellness plan error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve wellness plan' });
  }
});

// POST /api/wellness/request
// Submit a questionnaire to request a plan
router.post('/request', auth, async (req, res) => {
  try {
    const { goals, currentStruggles, preferredPace } = req.body;
    
    if (!goals || !goals.length) {
      return res.status(400).json({ error: 'Please specify at least one goal.' });
    }

    // Upsert any existing 'awaiting_admin' or uncompleted plan to prevent spam
    const activePlan = await WellnessPlan.findOne({
      user: req.user.id,
      status: { $in: ['awaiting_admin', 'active'] },
    });

    if (activePlan && activePlan.status === 'active') {
      return res.status(400).json({ error: 'You already have an active wellness plan.' });
    }

    if (activePlan && activePlan.status === 'awaiting_admin') {
      // Update their pending request
      activePlan.goals = goals;
      activePlan.currentStruggles = currentStruggles;
      activePlan.preferredPace = preferredPace;
      await activePlan.save();
      return res.status(200).json({ message: 'Wellness request updated. Admin is reviewing.', plan: activePlan });
    }

    // Create a new request
    const plan = new WellnessPlan({
      user: req.user.id,
      goals,
      currentStruggles,
      preferredPace,
      status: 'awaiting_admin',
    });
    await plan.save();

    res.status(201).json({ message: 'Wellness request submitted successfully.', plan });
  } catch (err) {
    console.error('Submit wellness request error:', err.message);
    res.status(500).json({ error: 'Failed to submit wellness request' });
  }
});

// PATCH /api/wellness/task/:dayId/:taskId/complete
// Toggle completion status of a daily task
router.patch('/task/:dayId/:taskId/complete', auth, async (req, res) => {
  try {
    const { dayId, taskId } = req.params;
    const { completed } = req.body;

    const plan = await WellnessPlan.findOne({ user: req.user.id, status: 'active' });
    if (!plan) return res.status(404).json({ error: 'No active plan found.' });

    let found = false;
    for (const d of plan.dailyPlans) {
      if (d._id.toString() === dayId) {
        for (const t of d.tasks) {
          if (t._id.toString() === taskId) {
            t.completed = completed;
            t.completedAt = completed ? new Date() : null;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    if (!found) return res.status(404).json({ error: 'Task not found in this plan.' });

    // Recalculate progress
    let done = 0;
    plan.dailyPlans.forEach(d => {
      d.tasks.forEach(t => { if (t.completed) done++; });
    });
    plan.totalTasksCompleted = done;

    await plan.save();
    res.json({ success: true, totalTasksCompleted: done, plan });
  } catch (err) {
    console.error('Toggle task complete error:', err.message);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
