const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const IssueReport = require('../models/IssueReport');
const MoodEntry = require('../models/MoodEntry');

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_TOKEN not configured on server' });
  }
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /api/admin/users - basic user + profile info for dashboard lists
router.get('/users', adminAuth, async (_req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const profiles = await Profile.find({}).lean();
    const profileByUser = {};
    profiles.forEach((p) => {
      profileByUser[String(p.userId)] = p;
    });
    const result = users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      age: u.age,
      gender: u.gender,
      profile: profileByUser[String(u._id)]
        ? {
            phone_no: profileByUser[String(u._id)].phone_no,
            concerns: profileByUser[String(u._id)].concerns || [],
          }
        : null,
    }));
    res.json(result);
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// GET /api/admin/issues?userId=... - all assessment reports, optionally filtered by user
router.get('/issues', adminAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { user: userId } : {};
    const reports = await IssueReport.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .lean();
    res.json(
      reports.map((r) => ({
        id: String(r._id),
        userId: String(r.user?._id || r.user),
        userName: r.user?.name,
        userEmail: r.user?.email,
        createdAt: r.createdAt,
        category: r.category,
        severity: r.severity,
        description: r.description,
        moodTag: r.moodTag,
        riskLevel: r.riskLevel,
        sentimentScore: r.sentimentScore,
        emotionTags: r.emotionTags,
        recommendations: r.recommendations,
      }))
    );
  } catch (err) {
    console.error('Admin issues error:', err.message);
    res.status(500).json({ error: 'Failed to load issues' });
  }
});

// GET /api/admin/mood?userId=... - mood history for trends / burnout prediction
router.get('/mood', adminAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { user: userId } : {};
    const moods = await MoodEntry.find(query)
      .sort({ date: -1 })
      .populate('user', 'name email')
      .lean();
    res.json(
      moods.map((m) => ({
        id: String(m._id),
        userId: String(m.user?._id || m.user),
        userName: m.user?.name,
        userEmail: m.user?.email,
        date: m.date,
        rating: m.rating,
        note: m.note,
      }))
    );
  } catch (err) {
    console.error('Admin mood error:', err.message);
    res.status(500).json({ error: 'Failed to load moods' });
  }
});

module.exports = router;

