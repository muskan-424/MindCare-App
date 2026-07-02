const express = require('express');
const router = express.Router();
const GroupSession = require('../models/GroupSession');
const { auth } = require('../../../../middleware/auth');
const { shapeGroupSession, shapeGroupSessions } = require('../../../shared/responseShapers');
const { localizeGroupSession, localizeGroupSessions } = require('../../../shared/localizeContent');

// Note: Admin authentication middleware (you'd typically import this)
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ==============================
// Admin Routes
// ==============================

// POST /api/groups
// Admin creates a new group session
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, scheduledDate, meetingLink, maxParticipants, facilitatorName } = req.body;
    
    if (!title || !description || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let finalMeetingLink = meetingLink;
    if (!finalMeetingLink || finalMeetingLink.trim() === '') {
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const randomStr = Math.random().toString(36).substring(2, 8);
      finalMeetingLink = `https://meet.jit.si/MindCare-${sanitizedTitle || 'Session'}-${randomStr}`;
    }

    const newGroup = new GroupSession({
      title,
      description,
      scheduledDate,
      meetingLink: finalMeetingLink,
      maxParticipants: maxParticipants || 10,
      facilitatorName: facilitatorName || 'MindCare Team',
    });

    await newGroup.save();
    res.status(201).json({ message: 'Group session created', session: shapeGroupSession(newGroup.toObject()) });
  } catch (err) {
    console.error('Create group error:', err.message);
    res.status(500).json({ error: 'Failed to create group session' });
  }
});

// GET /api/groups/admin
// Admin lists all groups
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const groups = await GroupSession.find()
      .sort({ scheduledDate: 1 })
      .populate('participants', 'name email')
      .lean();
    res.json(shapeGroupSessions(groups, { populateParticipants: true }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// PATCH /api/groups/:id/assign
// Admin assigns a user to a group
router.patch('/:id/assign', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await GroupSession.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    if (group.participants.includes(userId)) {
      return res.status(400).json({ error: 'User already in this group' });
    }

    if (group.participants.length >= group.maxParticipants) {
      return res.status(400).json({ error: 'Group is at maximum capacity' });
    }

    group.participants.push(userId);
    await group.save();
    
    // Optionally return populated group
    const populated = await GroupSession.findById(req.params.id)
      .populate('participants', 'name email')
      .lean();
    res.json({ message: 'User assigned to group successfully', session: shapeGroupSession(populated, { populateParticipants: true }) });
  } catch (err) {
    console.error('Assign user to group error:', err.message);
    res.status(500).json({ error: 'Failed to assign user' });
  }
});

// PATCH /api/groups/:id/remove
// Admin removes a user from a group
router.patch('/:id/remove', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await GroupSession.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    group.participants = group.participants.filter(id => id.toString() !== userId);
    await group.save();

    const populated = await GroupSession.findById(req.params.id)
      .populate('participants', 'name email')
      .lean();
    res.json({ message: 'User removed from group successfully', session: shapeGroupSession(populated, { populateParticipants: true }) });
  } catch (err) {
    console.error('Remove user from group error:', err.message);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await GroupSession.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ==============================
// User Routes
// ==============================

// GET /api/groups/my-groups
// Normal user sees what groups they are assigned to
router.get('/my-groups', auth, async (req, res) => {
  try {
    // Return all groups where the user's ID is in the array, and they are in the future
    const now = new Date();
    // Allow seeing groups that passed today to keep logic simple, or just upcoming
    const past24h = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const assignedGroups = await GroupSession.find({
      participants: req.user.id,
      isActive: true,
      scheduledDate: { $gte: past24h }
    }).sort({ scheduledDate: 1 }).lean();

    res.json(await localizeGroupSessions(shapeGroupSessions(assignedGroups), req.language));
  } catch (err) {
    console.error('Fetch my groups error:', err.message);
    res.status(500).json({ error: 'Failed to fetch assigned groups' });
  }
});

// GET /api/groups
// Normal user lists all active group sessions
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const sessions = await GroupSession.find({
      isActive: true,
      scheduledDate: { $gte: now }
    }).sort({ scheduledDate: 1 }).lean();

    const shaped = shapeGroupSessions(sessions);
    res.json(await localizeGroupSessions(shaped, req.language));
  } catch (err) {
    console.error('Fetch group sessions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch group sessions' });
  }
});

// POST /api/groups/:id/join
// Normal user joins a group session
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await GroupSession.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group session not found' });

    if (!group.isActive) {
      return res.status(400).json({ error: 'This session is no longer active' });
    }

    if (group.participants.includes(req.user.id)) {
      return res.status(400).json({ error: 'You are already registered for this session' });
    }

    if (group.participants.length >= group.maxParticipants) {
      return res.status(400).json({ error: 'This session is full' });
    }

    group.participants.push(req.user.id);
    await group.save();

    res.json({
      message: 'Joined group session successfully',
      session: await localizeGroupSession(shapeGroupSession(group.toObject()), req.language),
    });
  } catch (err) {
    console.error('Join group session error:', err.message);
    res.status(500).json({ error: 'Failed to join group session' });
  }
});

module.exports = router;
