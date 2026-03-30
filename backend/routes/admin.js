const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Profile = require('../models/Profile');
const IssueReport = require('../models/IssueReport');
const MoodEntry = require('../models/MoodEntry');
const ActivityLog = require('../models/ActivityLog');
const JournalEntry = require('../models/JournalEntry');
const Appointment = require('../models/Appointment');
const EmergencyContact = require('../models/EmergencyContact');
const WellnessPlan = require('../models/WellnessPlan');
const DeletionRequest = require('../models/DeletionRequest');

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

// POST /api/admin/log - receive telemetry from standard users
router.post('/log', async (req, res) => {
  try {
    const { userId, action, metadata } = req.body;
    if (!userId || !action) {
      return res.status(400).json({ error: 'userId and action are required' });
    }
    const logEntry = new ActivityLog({
      user: userId,
      action,
      metadata: metadata || {}
    });
    await logEntry.save();
    res.status(200).json({ success: true });
  } catch (err) {
    // Fail silently on client side to not disrupt UX
    console.error('Telemetry error:', err.message);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// GET /api/admin/activity_feed - global telemetry stream
router.get('/activity_feed', adminAuth, async (req, res) => {
  try {
    const logs = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('user', 'name email')
      .lean();
    
    const result = logs.map(l => ({
      id: String(l._id),
      userId: String(l.user?._id || l.user),
      userName: l.user?.name || 'Unknown User',
      action: l.action,
      metadata: l.metadata,
      timestamp: l.timestamp
    }));
    res.json(result);
  } catch (err) {
    console.error('Admin feed error:', err.message);
    res.status(500).json({ error: 'Failed to load activity feed' });
  }
});

// GET /api/admin/stats — platform-wide summary for dashboard header
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const [totalUsers, totalAssessments, criticalToday, highRiskWeek, totalJournals, recentMoods] = await Promise.all([
      User.countDocuments(),
      IssueReport.countDocuments(),
      IssueReport.countDocuments({ riskLevel: 'CRITICAL', createdAt: { $gte: todayStart } }),
      IssueReport.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] }, createdAt: { $gte: weekStart } }),
      JournalEntry.countDocuments(),
      MoodEntry.find({ date: { $gte: weekStart } }).lean(),
    ]);

    const avgMoodWeek = recentMoods.length
      ? (recentMoods.reduce((s, m) => s + m.rating, 0) / recentMoods.length).toFixed(1)
      : null;

    res.json({ totalUsers, totalAssessments, criticalToday, highRiskWeek, totalJournals, avgMoodWeek: avgMoodWeek ? Number(avgMoodWeek) : null });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// GET /api/admin/analytics — risk trend over last 30 days (for charts)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const riskTrend = await IssueReport.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, riskLevel: '$riskLevel' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.date': 1 } },
    ]);

    const moodHeatmap = await MoodEntry.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    res.json({ riskTrend, moodHeatmap });
  } catch (err) {
    console.error('Admin analytics error:', err.message);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// PATCH /api/admin/users/:id/flag — flag or unflag a user as at-risk
router.patch('/users/:id/flag', adminAuth, async (req, res) => {
  try {
    const { flagged, flagReason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { flagged: !!flagged, flagReason: flagReason || '' } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, flagged: user.flagged });
  } catch (err) {
    console.error('Admin flag error:', err.message);
    res.status(500).json({ error: 'Failed to flag user' });
  }
});

// DELETE /api/admin/users/:id — deactivate a user account
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { active: false } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User account deactivated' });
  } catch (err) {
    console.error('Admin delete user error:', err.message);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// GET /api/admin/appointments — all appointment requests (filterable by status)
router.get('/appointments', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('therapist', 'name specialisation img timing')
      .lean();
    res.json(appointments.map(a => ({
      id: String(a._id),
      userName: a.user?.name || 'Unknown',
      userEmail: a.user?.email || '',
      requestedSpeciality: a.requestedSpeciality,
      preferredDates: a.preferredDates,
      preferredTime: a.preferredTime,
      userNote: a.userNote,
      therapistId: a.therapist ? String(a.therapist._id) : null,
      therapistName: a.therapist?.name || null,
      therapistSpeciality: a.therapist?.specialisation || null,
      therapistTiming: a.therapist?.timing || null,
      date: a.date || null,
      timeSlot: a.timeSlot || null,
      adminNote: a.adminNote,
      status: a.status,
      createdAt: a.createdAt,
    })));
  } catch (err) {
    console.error('Admin appointments error:', err.message);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

// GET /api/admin/therapist-availability?therapistId=X&date=YYYY-MM-DD
// Admin checks which slots are free for a therapist on a specific date
router.get('/therapist-availability', adminAuth, async (req, res) => {
  try {
    const { therapistId, date } = req.query;
    if (!therapistId || !date) {
      return res.status(400).json({ error: 'therapistId and date are required' });
    }
    const Therapist = require('../models/Therapist');
    const therapist = await Therapist.findById(therapistId).lean();
    if (!therapist) return res.status(404).json({ error: 'Therapist not found' });

    // Generate all slots from therapist timing
    const { generateSlots } = require('./appointments');
    const allSlots = generateSlots(therapist.timing);

    // Find already-booked slots for this therapist/date
    const booked = await Appointment.find({
      therapist: therapistId,
      date,
      status: { $in: ['pending', 'confirmed'] },
    }).lean();
    const bookedSet = new Set(booked.map(a => a.timeSlot));
    const available = allSlots.filter(s => !bookedSet.has(s));

    res.json({
      therapistId,
      therapistName: therapist.name,
      timing: therapist.timing,
      date,
      available,
      booked: [...bookedSet],
    });
  } catch (err) {
    console.error('Therapist availability error:', err.message);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// POST /api/admin/appointments/:id/assign — admin assigns a therapist + slot to a request
router.post('/appointments/:id/assign', adminAuth, async (req, res) => {
  try {
    const { therapistId, date, timeSlot, adminNote } = req.body;
    if (!therapistId || !date || !timeSlot) {
      return res.status(400).json({ error: 'therapistId, date, and timeSlot are required' });
    }

    // Check for conflicts
    const conflict = await Appointment.findOne({
      therapist: therapistId,
      date,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: req.params.id },
    });
    if (conflict) {
      return res.status(409).json({ error: 'This therapist already has a booking at this slot.' });
    }

    const Therapist = require('../models/Therapist');
    const therapist = await Therapist.findById(therapistId).lean();
    if (!therapist) return res.status(404).json({ error: 'Therapist not found' });

    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          therapist: therapistId,
          date,
          timeSlot,
          adminNote: adminNote?.trim() || '',
          status: 'confirmed',
        },
      },
      { new: true }
    ).populate('user', 'name email');

    if (!appt) return res.status(404).json({ error: 'Request not found' });
    res.json({
      success: true,
      id: String(appt._id),
      userName: appt.user?.name,
      therapistName: therapist.name,
      date: appt.date,
      timeSlot: appt.timeSlot,
      status: appt.status,
    });
  } catch (err) {
    console.error('Assign appointment error:', err.message);
    res.status(500).json({ error: 'Failed to assign appointment' });
  }
});

// PATCH /api/admin/appointments/:id/status — cancel or mark completed
router.patch('/appointments/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['pending', 'confirmed', 'cancelled', 'completed', 'awaiting_admin'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const update = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;
    const appt = await Appointment.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true, status: appt.status });
  } catch (err) {
    console.error('Admin appt status error:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PATCH /api/admin/issues/:id/verify — admin reviews and verifies a risk report
router.patch('/issues/:id/verify', adminAuth, async (req, res) => {
  try {
    const { adminNote, adminAction, assignedResources } = req.body;
    if (!['none', 'contacted', 'referred', 'resolved'].includes(adminAction)) {
      return res.status(400).json({ error: 'Invalid adminAction' });
    }
    const update = { adminVerified: true, adminNote: adminNote?.trim() || '', adminAction };
    if (assignedResources && Array.isArray(assignedResources)) {
      update.assignedResources = assignedResources;
    }
    const report = await IssueReport.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('user', 'name email');
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true, id: String(report._id), adminVerified: report.adminVerified, adminAction: report.adminAction });
  } catch (err) {
    console.error('Admin verify issue error:', err.message);
    res.status(500).json({ error: 'Failed to verify report' });
  }
});

// GET /api/admin/pending-verification — one-stop: unverified HIGH/CRITICAL reports + awaiting_admin bookings
router.get('/pending-verification', adminAuth, async (req, res) => {
  try {
    const [pendingAppointments, pendingIssues, pendingContacts, pendingWellnessPlans, pendingDeletions] = await Promise.all([
      Appointment.find({ status: 'awaiting_admin' })
        .sort({ createdAt: 1 })
        .populate('user', 'name email')
        .lean(),
      IssueReport.find({ adminVerified: false, riskLevel: { $in: ['HIGH', 'CRITICAL'] } })
        .sort({ escalated: -1, createdAt: -1 })  // escalated ones bubble to top
        .populate('user', 'name email')
        .lean(),
      EmergencyContact.find({ status: 'awaiting_admin' })
        .sort({ createdAt: 1 })
        .populate('user', 'name email')
        .lean(),
      WellnessPlan.find({ status: 'awaiting_admin' })
        .sort({ createdAt: 1 })
        .populate('user', 'name email')
        .lean(),
      DeletionRequest.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .populate('user', 'name email')
        .lean(),
    ]);
    const escalatedCount = pendingIssues.filter(r => r.escalated).length;

    res.json({
      appointmentRequests: pendingAppointments.map(a => ({
        id: String(a._id),
        userId: String(a.user?._id),
        type: 'appointment_request',
        userName: a.user?.name || 'Unknown',
        userEmail: a.user?.email || '',
        requestedSpeciality: a.requestedSpeciality,
        preferredDates: a.preferredDates,
        preferredTime: a.preferredTime,
        userNote: a.userNote,
        createdAt: a.createdAt,
      })),
      riskReports: pendingIssues.map(r => ({
        id: String(r._id),
        userId: String(r.user?._id),
        type: 'risk_report',
        userName: r.user?.name || 'Unknown',
        userEmail: r.user?.email || '',
        riskLevel: r.riskLevel,
        category: r.category,
        severity: r.severity,
        description: r.description,
        emotionTags: r.emotionTags,
        safetyTriggered: r.safetyTriggered,
        createdAt: r.createdAt,
        // SLA / Escalation info
        escalated: r.escalated || false,
        escalatedAt: r.escalatedAt || null,
        slaBreachMinutes: r.slaBreachMinutes || null,
      })),
      wellnessPlans: pendingWellnessPlans.map(w => ({
        id: String(w._id),
        userId: String(w.user?._id),
        type: 'wellness_plan',
        userName: w.user?.name || 'Unknown',
        userEmail: w.user?.email || '',
        goals: w.goals,
        currentStruggles: w.currentStruggles,
        preferredPace: w.preferredPace,
        createdAt: w.createdAt,
      })),
      deletionRequests: pendingDeletions.map(d => ({
        id: String(d._id),
        userId: String(d.user?._id),
        type: 'deletion_request',
        userName: d.user?.name || 'Unknown',
        userEmail: d.user?.email || '',
        reason: d.reason,
        createdAt: d.createdAt,
      })),
      totalPending: pendingAppointments.length + pendingIssues.length + pendingContacts.length + pendingWellnessPlans.length + pendingDeletions.length,
      escalatedCount,
    });
  } catch (err) {
    console.error('Pending verification error:', err.message);
    res.status(500).json({ error: 'Failed to load pending items' });
  }
});

// POST /api/admin/sla/run — manually trigger the SLA escalation check
router.post('/sla/run', adminAuth, async (req, res) => {
  try {
    const { runSLACheck } = require('../services/slaMonitor');
    await runSLACheck();
    res.json({ success: true, message: 'SLA check completed. Escalated reports updated.' });
  } catch (err) {
    console.error('Manual SLA run error:', err.message);
    res.status(500).json({ error: 'SLA check failed' });
  }
});

// ── Emergency Contact Admin Endpoints ──────────────────────────────────────

// GET /api/admin/emergency-contacts — pending contacts awaiting verification
router.get('/emergency-contacts', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : { status: 'awaiting_admin' };
    const contacts = await EmergencyContact.find(query)
      .sort({ createdAt: 1 })
      .populate('user', 'name email')
      .lean();
    res.json(contacts.map(c => ({
      id: String(c._id),
      userId: String(c.user?._id),
      userName: c.user?.name || 'Unknown',
      userEmail: c.user?.email || '',
      contactName: c.name,
      relationship: c.relationship,
      phone: c.phone,  // full phone visible to admin only
      reachVia: c.reachVia,
      userMessage: c.userMessage,
      status: c.status,
      callLogCount: c.callLog?.length || 0,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    console.error('Admin get EC error:', err.message);
    res.status(500).json({ error: 'Failed to load emergency contacts' });
  }
});

// PATCH /api/admin/emergency-contacts/:id/verify — admin approves
router.patch('/emergency-contacts/:id/verify', adminAuth, async (req, res) => {
  try {
    const { adminNote } = req.body;
    const ec = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'verified', adminNote: adminNote?.trim() || '', rejectionReason: '' } },
      { new: true }
    ).populate('user', 'name email');
    if (!ec) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true, status: ec.status, userName: ec.user?.name });
  } catch (err) {
    console.error('Admin verify EC error:', err.message);
    res.status(500).json({ error: 'Failed to verify contact' });
  }
});

// PATCH /api/admin/emergency-contacts/:id/reject — admin rejects with reason
router.patch('/emergency-contacts/:id/reject', adminAuth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const ec = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected', rejectionReason: rejectionReason?.trim() || 'Contact rejected by admin.' } },
      { new: true }
    );
    if (!ec) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true, status: ec.status });
  } catch (err) {
    console.error('Admin reject EC error:', err.message);
    res.status(500).json({ error: 'Failed to reject contact' });
  }
});

// POST /api/admin/emergency-contacts/:userId/log-call — log that admin called the contact
router.post('/emergency-contacts/:userId/log-call', adminAuth, async (req, res) => {
  try {
    const { outcome, adminNote, triggeredBy } = req.body;
    const VALID_OUTCOMES = ['reached', 'no_answer', 'voicemail', 'referred'];
    if (!VALID_OUTCOMES.includes(outcome)) {
      return res.status(400).json({ error: `outcome must be one of: ${VALID_OUTCOMES.join(', ')}` });
    }
    const ec = await EmergencyContact.findOneAndUpdate(
      { user: req.params.userId, status: 'verified' },
      {
        $push: {
          callLog: {
            calledAt: new Date(),
            outcome,
            adminNote: adminNote?.trim() || '',
            triggeredBy: triggeredBy || '',
          },
        },
      },
      { new: true }
    );
    if (!ec) return res.status(404).json({ error: 'Verified emergency contact not found for this user' });
    res.json({ success: true, callLogCount: ec.callLog.length });
  } catch (err) {
    console.error('Log call error:', err.message);
    res.status(500).json({ error: 'Failed to log call' });
  }
});

// GET /api/admin/emergency-contacts/:userId — get full contact info for a user (for crisis UI)
router.get('/emergency-contacts/:userId', adminAuth, async (req, res) => {
  try {
    const ec = await EmergencyContact.findOne({ user: req.params.userId, status: 'verified' })
      .populate('user', 'name email')
      .lean();
    if (!ec) return res.json({ exists: false });
    res.json({
      exists: true,
      id: String(ec._id),
      contactName: ec.name,
      relationship: ec.relationship,
      phone: ec.phone,
      reachVia: ec.reachVia,
      userMessage: ec.userMessage,
      callLogCount: ec.callLog?.length || 0,
      lastCalledAt: ec.callLog?.length ? ec.callLog[ec.callLog.length - 1].calledAt : null,
    });
  } catch (err) {
    console.error('Get EC for user error:', err.message);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

// POST /api/admin/wellness-plans/:id/assign — admin builds and assigns a wellness plan
router.post('/wellness-plans/:id/assign', adminAuth, async (req, res) => {
  try {
    const { planFocus, adminNote, planDurationDays, dailyPlans } = req.body;
    
    // Ensure dailyPlans is minimally valid
    if (!Array.isArray(dailyPlans) || dailyPlans.length === 0) {
      return res.status(400).json({ error: 'You must provide at least one day of tasks.' });
    }

    const plan = await WellnessPlan.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'active',
          planFocus,
          adminNote,
          planDurationDays: planDurationDays || 30,
          dailyPlans,
          startDate: new Date(),
          totalTasksCompleted: 0,
        },
      },
      { new: true }
    );

    if (!plan) return res.status(404).json({ error: 'Wellness plan request not found' });
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Admin assign wellness plan error:', err.message);
    res.status(500).json({ error: 'Failed to assign wellness plan' });
  }
});

// PATCH /api/admin/deletion-requests/:id/review — admin reviews a deletion request
router.patch('/deletion-requests/:id/review', adminAuth, async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const request = await DeletionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    if (action === 'reject') {
      request.status = 'rejected';
      request.adminNote = adminNote || '';
      await request.save();
      return res.json({ success: true, message: 'Request rejected' });
    }

    if (action === 'approve') {
      const userId = request.user;
      
      // Cascading delete
      await Promise.all([
        Profile.deleteOne({ userId }),
        IssueReport.deleteMany({ user: userId }),
        MoodEntry.deleteMany({ user: userId }),
        ActivityLog.deleteMany({ user: userId }),
        JournalEntry.deleteMany({ user: userId }),
        Appointment.deleteMany({ user: userId }),
        EmergencyContact.deleteMany({ user: userId }),
        WellnessPlan.deleteMany({ user: userId })
      ]);

      // Remove the user document last
      await User.findByIdAndDelete(userId);

      // Update request status (though user is gone, keep audit trail)
      request.status = 'approved';
      request.adminNote = adminNote || 'Account deleted and data purged';
      await request.save();

      return res.json({ success: true, message: 'Data fully wiped successfully' });
    }
  } catch (err) {
    console.error('Account deletion error:', err.message);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

module.exports = router;


