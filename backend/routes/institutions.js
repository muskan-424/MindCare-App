const express = require('express');
const router = express.Router();
const Institution = require('../models/Institution');
const User = require('../models/User');
const Profile = require('../models/Profile');
const MoodEntry = require('../models/MoodEntry');
const IssueReport = require('../models/IssueReport');
const { auth } = require('../middleware/auth');

// Helper for super-admin check
const superAdminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: Super-admin only' });
  }
  next();
};

// ── Super-Admin Endpoints ───────────────────────────────────────────────────

// POST /api/institutions - Create a new institution
router.post('/', superAdminAuth, async (req, res) => {
  try {
    const { name, accessCode, adminEmails } = req.body;
    if (!name || !accessCode) return res.status(400).json({ error: 'Name and accessCode are required' });

    // Find users by email to make them admins
    const admins = await User.find({ email: { $in: adminEmails || [] } });
    
    const inst = new Institution({
      name,
      accessCode: accessCode.toUpperCase(),
      admins: admins.map(a => a._id)
    });

    await inst.save();
    res.status(201).json(inst);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Access code already exists' });
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

// ── User Endpoints ─────────────────────────────────────────────────────────

// POST /api/institutions/join - Join via access code
router.post('/join', auth, async (req, res) => {
  try {
    const { accessCode } = req.body;
    const inst = await Institution.findOne({ accessCode: accessCode.toUpperCase() });
    if (!inst) return res.status(404).json({ error: 'Invalid access code' });

    // Update User
    await User.findByIdAndUpdate(req.user.id, { institutionId: inst._id });
    
    // Update Institution member list
    if (!inst.members.includes(req.user.id)) {
      inst.members.push(req.user.id);
      await inst.save();
    }

    res.json({ success: true, institutionName: inst.name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join institution' });
  }
});

// ── Reporting Endpoints ─────────────────────────────────────────────────────

// GET /api/institutions/:id/report - Aggregate anonymized report
router.get('/:id/report', auth, async (req, res) => {
  try {
    const inst = await Institution.findById(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });

    // Ensure requester is an admin of this institution
    if (!inst.admins.includes(req.user.id)) {
      return res.status(401).json({ error: 'Unauthorized: Not an institution admin' });
    }

    // Minimum members check for privacy
    if (inst.members.length < 5) {
      return res.status(403).json({ error: 'Privacy protection: Reports require at least 5 members.' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [moodStats, concernStats, riskStats] = await Promise.all([
      // 1. Mood Trends
      MoodEntry.aggregate([
        { $match: { user: { $in: inst.members }, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, avgRating: { $avg: '$rating' } } },
        { $sort: { '_id': 1 } }
      ]),
      // 2. Concern Distribution (Anonymized)
      Profile.aggregate([
        { $match: { userId: { $in: inst.members } } },
        { $unwind: '$concerns' },
        { $group: { _id: '$concerns', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // 3. Risk Level Distribution
      IssueReport.aggregate([
        { $match: { user: { $in: inst.members }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
        institutionName: inst.name,
        memberCount: inst.members.length,
        moodTrends: moodStats.map(m => ({ date: m._id, value: m.avgRating })),
        topConcerns: concernStats.map(c => ({ concern: c._id, count: c.count })),
        riskDistribution: riskStats.map(r => ({ level: r._id, count: r.count })),
        generatedAt: new Date()
    });
  } catch (err) {
    console.error('Report error:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
