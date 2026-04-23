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
const AdminAuditLog = require('../models/AdminAuditLog');
const Resource = require('../models/Resource');
const Therapist = require('../models/Therapist');
const Notification = require('../models/Notification');

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

// ─── Audit Trail Helper ────────────────────────────────────────────────────────
async function logAdminAction(action, adminId, targetUserId = null, metadata = {}) {
  try {
    await AdminAuditLog.create({
      adminId: String(adminId || 'system'),
      action,
      targetUser: targetUserId || null,
      metadata,
    });
  } catch (e) {
    // Fail silently — never block a clinical action due to logging
    console.error('[AuditLog] Failed to write:', e.message);
  }
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
      role: u.role || 'user',
      suspended: u.suspended || false,
      flagged: u.flagged || false,
      flagReason: u.flagReason || '',
      createdAt: u.createdAt,
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

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const VALID_ROLES = ['user', 'clinician', 'super_admin'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    await logAdminAction('change_user_role', req.headers['x-admin-id'] || 'admin', user._id, { newRole: role });
    res.json({ success: true, role: user.role });
  } catch (err) {
    console.error('Admin role error:', err.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/suspend — suspend or reinstate a user
router.patch('/users/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { suspended, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { suspended: !!suspended } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    await logAdminAction(
      suspended ? 'suspend_user' : 'reinstate_user',
      req.headers['x-admin-id'] || 'admin',
      user._id,
      { reason: reason || '' }
    );
    res.json({ success: true, suspended: user.suspended });
  } catch (err) {
    console.error('Admin suspend error:', err.message);
    res.status(500).json({ error: 'Failed to update suspension' });
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

// NOTE: Advanced analytics (with KPIs) is handled further below in Section 8.

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
    await logAdminAction('assign_appointment', req.headers['x-admin-id'] || 'admin', appt.user?._id, {
      appointmentId: String(appt._id),
      therapistId,
      therapistName: therapist.name,
      date,
      timeSlot,
    });
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
    await logAdminAction('verify_risk_report', req.headers['x-admin-id'] || 'admin', report.user?._id, {
      reportId: String(report._id),
      riskLevel: report.riskLevel,
      adminAction,
      adminNote: adminNote?.trim() || '',
      resourcesAssigned: (assignedResources || []).length,
    });
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
    await logAdminAction('verify_emergency_contact', req.headers['x-admin-id'] || 'admin', ec.user?._id, {
      contactId: String(ec._id),
      contactName: ec.name,
    });
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
    ).populate('user', 'name email');
    if (!ec) return res.status(404).json({ error: 'Contact not found' });
    await logAdminAction('reject_emergency_contact', req.headers['x-admin-id'] || 'admin', ec.user?._id, {
      contactId: String(ec._id),
      reason: rejectionReason?.trim() || '',
    });
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
    ).populate('user', 'name email');

    if (!plan) return res.status(404).json({ error: 'Wellness plan request not found' });
    await logAdminAction('assign_wellness_plan', req.headers['x-admin-id'] || 'admin', plan.user?._id, {
      planId: String(plan._id),
      planFocus,
      totalDays: planDurationDays || 30,
      taskCount: dailyPlans.reduce((s, d) => s + (d.tasks?.length || 0), 0),
    });
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

// ── Therapist Management Hub ───────────────────────────────────────────────────

// POST /api/admin/therapists — add a new therapist
router.post('/therapists', adminAuth, async (req, res) => {
  try {
    const Therapist = require('../models/Therapist');
    const { name, specialisation, timing, img, about } = req.body;
    if (!name || !specialisation) {
      return res.status(400).json({ error: 'name and specialisation are required' });
    }
    const therapist = await Therapist.create({
      name: name.trim(),
      specialisation: specialisation.trim(),
      timing: timing || '',
      img: img || '',
      about: about || '',
    });
    await logAdminAction('add_therapist', req.headers['x-admin-id'] || 'admin', null, {
      therapistId: String(therapist._id),
      name: therapist.name,
      specialisation: therapist.specialisation,
    });
    res.status(201).json({ success: true, id: String(therapist._id), name: therapist.name });
  } catch (err) {
    console.error('Admin add therapist error:', err.message);
    res.status(500).json({ error: 'Failed to create therapist' });
  }
});

// GET /api/admin/therapists — get all therapists with linked userId info
router.get('/therapists', adminAuth, async (req, res) => {
  try {
    const Therapist = require('../models/Therapist');
    const therapists = await Therapist.find({})
      .populate('userId', 'name email')
      .lean();
    res.json(therapists.map(t => ({
      ...t,
      id: String(t._id),
      linkedUserEmail: t.userId?.email || null,
      linkedUserName: t.userId?.name || null
    })));
  } catch (err) {
    console.error('Admin get therapists error:', err.message);
    res.status(500).json({ error: 'Failed to query therapists' });
  }
});

// POST /api/admin/therapists/:id/link-user — link a therapist to a user account
router.post('/therapists/:id/link-user', adminAuth, async (req, res) => {
  try {
    const Therapist = require('../models/Therapist');
    const { userId } = req.body;
    
    // Allow unlinking if userId is null
    const updatePayload = userId ? { userId } : { $unset: { userId: 1 } };
    
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    ).populate('userId', 'name email');
    
    if (!therapist) return res.status(404).json({ error: 'Therapist not found' });
    
    await logAdminAction('link_therapist_account', req.headers['x-admin-id'] || 'admin', userId || null, {
      therapistId: String(therapist._id),
      userId: userId || null
    });
    res.json({ success: true, therapist });
  } catch (err) {
    console.error('Admin link therapist error:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'This user account is already linked to another therapist.' });
    }
    res.status(500).json({ error: 'Failed to link account' });
  }
});

// PUT /api/admin/therapists/:id — update therapist details
router.put('/therapists/:id', adminAuth, async (req, res) => {
  try {
    const Therapist = require('../models/Therapist');
    const { name, specialisation, timing, img, about, active } = req.body;
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (specialisation !== undefined) update.specialisation = specialisation.trim();
    if (timing !== undefined) update.timing = timing;
    if (img !== undefined) update.img = img;
    if (about !== undefined) update.about = about;
    if (active !== undefined) update.active = active;
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!therapist) return res.status(404).json({ error: 'Therapist not found' });
    await logAdminAction('update_therapist', req.headers['x-admin-id'] || 'admin', null, {
      therapistId: String(therapist._id),
      changes: Object.keys(update),
    });
    res.json({ success: true, therapist });
  } catch (err) {
    console.error('Admin update therapist error:', err.message);
    res.status(500).json({ error: 'Failed to update therapist' });
  }
});

// DELETE /api/admin/therapists/:id — remove therapist
router.delete('/therapists/:id', adminAuth, async (req, res) => {
  try {
    const Therapist = require('../models/Therapist');
    const therapist = await Therapist.findByIdAndDelete(req.params.id);
    if (!therapist) return res.status(404).json({ error: 'Therapist not found' });
    await logAdminAction('delete_therapist', req.headers['x-admin-id'] || 'admin', null, {
      therapistId: req.params.id,
      name: therapist.name,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete therapist error:', err.message);
    res.status(500).json({ error: 'Failed to delete therapist' });
  }
});

// ── Resource CMS ───────────────────────────────────────────────────────────────

// GET /api/admin/resources — list all resources
router.get('/resources', adminAuth, async (req, res) => {
  try {
    const resources = await Resource.find({}).sort({ createdAt: -1 }).lean();
    res.json(resources.map(r => ({
      id: String(r._id),
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      active: r.active,
      createdAt: r.createdAt,
    })));
  } catch (err) {
    console.error('Admin get resources error:', err.message);
    res.status(500).json({ error: 'Failed to load resources' });
  }
});

// POST /api/admin/resources — create a new resource
router.post('/resources', adminAuth, async (req, res) => {
  try {
    const { title, type, url, description } = req.body;
    if (!title || !type || !url) {
      return res.status(400).json({ error: 'title, type, and url are required' });
    }
    if (!['article', 'video', 'exercise'].includes(type)) {
      return res.status(400).json({ error: 'type must be article, video, or exercise' });
    }
    const resource = await Resource.create({
      title: title.trim(),
      type,
      url: url.trim(),
      description: description?.trim() || '',
    });
    await logAdminAction('create_resource', req.headers['x-admin-id'] || 'admin', null, {
      resourceId: String(resource._id),
      title: resource.title,
      type: resource.type,
    });
    res.status(201).json({ success: true, id: String(resource._id) });
  } catch (err) {
    console.error('Admin create resource error:', err.message);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// PUT /api/admin/resources/:id — update a resource
router.put('/resources/:id', adminAuth, async (req, res) => {
  try {
    const { title, type, url, description, active } = req.body;
    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (type !== undefined) update.type = type;
    if (url !== undefined) update.url = url.trim();
    if (description !== undefined) update.description = description.trim();
    if (active !== undefined) update.active = active;
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    await logAdminAction('update_resource', req.headers['x-admin-id'] || 'admin', null, {
      resourceId: String(resource._id),
      changes: Object.keys(update),
    });
    res.json({ success: true, resource });
  } catch (err) {
    console.error('Admin update resource error:', err.message);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// DELETE /api/admin/resources/:id — remove a resource
router.delete('/resources/:id', adminAuth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    await logAdminAction('delete_resource', req.headers['x-admin-id'] || 'admin', null, {
      resourceId: req.params.id,
      title: resource.title,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete resource error:', err.message);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ── Audit Trail ─────────────────────────────────────────────────────────────────

// GET /api/admin/audit-logs — paginated audit trail
router.get('/audit-logs', adminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = parseInt(req.query.skip) || 0;
    const logs = await AdminAuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('targetUser', 'name email')
      .lean();
    const total = await AdminAuditLog.countDocuments();
    res.json({
      total,
      logs: logs.map(l => ({
        id: String(l._id),
        adminId: l.adminId,
        action: l.action,
        targetUserName: l.targetUser?.name || null,
        targetUserEmail: l.targetUser?.email || null,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin audit log error:', err.message);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

// ── Broadcast Notifications Hub ─────────────────────────────────────────────

// POST /api/admin/notifications/broadcast — send a broadcast message
router.post('/notifications/broadcast', adminAuth, async (req, res) => {
  try {
    const { title, body, audience } = req.body;
    if (!title || !body || !audience) {
      return res.status(400).json({ error: 'title, body, and audience are required' });
    }
    if (!['all_users', 'therapists'].includes(audience)) {
      return res.status(400).json({ error: 'audience must be all_users or therapists' });
    }

    // Count recipients
    let recipientCount = 0;
    if (audience === 'all_users') {
      recipientCount = await User.countDocuments({ suspended: { $ne: true } });
    } else if (audience === 'therapists') {
      recipientCount = await Therapist.countDocuments({ active: true });
    }

    const notification = await Notification.create({
      title: title.trim(),
      body: body.trim(),
      audience,
      sentBy: req.headers['x-admin-id'] || 'admin',
      recipientCount,
    });

    await logAdminAction('broadcast_notification', req.headers['x-admin-id'] || 'admin', null, {
      notificationId: String(notification._id),
      title: notification.title,
      audience,
      recipientCount,
    });

    res.status(201).json({
      success: true,
      id: String(notification._id),
      recipientCount,
    });
  } catch (err) {
    console.error('Broadcast notification error:', err.message);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// GET /api/admin/notifications — list all broadcasts (newest first)
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = parseInt(req.query.skip) || 0;
    const [notifications, total] = await Promise.all([
      Notification.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(),
    ]);
    res.json({
      total,
      notifications: notifications.map(n => ({
        id: String(n._id),
        title: n.title,
        body: n.body,
        audience: n.audience,
        sentBy: n.sentBy,
        recipientCount: n.recipientCount,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// ------------------------------------------------------------------
// 8. ADVANCED ANALYTICS & REPORTING
// ------------------------------------------------------------------

// [GET] /api/admin/analytics
// Returns system risk trends, mood heatmaps locally, and core KPIs for the dashboard
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // 1. Risk Trends (IssueReports over last 30 days)
    const riskTrend = await IssueReport.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, severity: { $gte: 3 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          avgSeverity: { $avg: "$severity" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Global Mood Heatmap (last 90 days)
    const moodHeatmap = await MoodEntry.aggregate([
      { $match: { date: { $gte: ninetyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Core KPIs
    const [totalUsers, escalatedReports, activeTherapists, pendingAppointments] = await Promise.all([
      User.countDocuments({}),
      IssueReport.countDocuments({ escalated: true, adminAction: { $ne: 'resolved' } }),
      Therapist.countDocuments({ active: true }),
      Appointment.countDocuments({ status: { $in: ['awaiting_admin', 'pending'] } })
    ]);

    res.json({
      riskTrend: riskTrend.map(r => ({ _id: { date: r._id }, count: r.count, avgSeverity: r.avgSeverity })),
      moodHeatmap: moodHeatmap.map(m => ({ _id: m._id, avgRating: m.avgRating, count: m.count })),
      kpis: {
        totalUsers,
        escalatedReports,
        activeTherapists,
        pendingAppointments
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// [GET] /api/admin/export/:type
// Export data as CSV for compliance reporting (patients, audit)
router.get('/export/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    let csvRows = [];
    let filename = '';

    if (type === 'audit') {
      const logs = await AdminAuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .populate('targetUser', 'name email')
        .lean();
      filename = `mindcare_audit_${Date.now()}.csv`;
      csvRows.push(['Timestamp', 'Admin', 'Action', 'Target User', 'Target Email', 'Metadata']);
      logs.forEach(l => {
        csvRows.push([
          new Date(l.createdAt).toISOString(),
          l.adminId,
          l.action,
          l.targetUser?.name || '',
          l.targetUser?.email || '',
          JSON.stringify(l.metadata || {}),
        ]);
      });
      await logAdminAction('export_audit_logs', req.headers['x-admin-id'] || 'admin', null, { recordCount: logs.length });
    } else if (type === 'patients') {
      const users = await User.find({}).sort({ createdAt: -1 }).limit(1000).lean();
      filename = `mindcare_patients_${Date.now()}.csv`;
      csvRows.push(['Name', 'Email', 'Role', 'Suspended', 'Joined']);
      users.forEach(u => {
        csvRows.push([
          u.name,
          u.email,
          u.role || 'user',
          u.suspended ? 'Yes' : 'No',
          new Date(u.createdAt).toISOString(),
        ]);
      });
      await logAdminAction('export_patients', req.headers['x-admin-id'] || 'admin', null, { recordCount: users.length });
    } else {
      return res.status(400).json({ error: 'Invalid export type. Allowed: audit, patients' });
    }

    // Convert rows to CSV string
    const csv = csvRows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
