const express = require('express');
const router = express.Router();
const PeerConnection = require('../models/PeerConnection');
const Profile = require('../../identity/models/Profile');
const { auth } = require('../../../../middleware/auth');
const {
  shapePeerSuggestion,
  shapePeerRequestsResponse,
  shapePeerConnection,
} = require('../../../shared/responseShapers');

router.use(auth);

// ── GET /api/peers/suggestions ────────────────────────────────────────────────
// Find up to 10 suggested peers based on shared concerns
router.get('/suggestions', async (req, res) => {
  try {
    const myProfile = await Profile.findOne({ userId: req.user.id });
    if (!myProfile || !myProfile.concerns.length) {
      return res.json([]);
    }

    // 1. Find all existing connections for me (to exclude )
    const existing = await PeerConnection.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
    }).lean();
    const excludedUserIds = new Set(existing.map((c) =>
      String(c.requester) === String(req.user.id) ? String(c.recipient) : String(c.requester)
    ));
    excludedUserIds.add(String(req.user.id));

    // 2. Find eligible profiles
    const matches = await Profile.find({
      userId: { $nin: Array.from(excludedUserIds) },
      isPeerMatchingEnabled: true,
      concerns: { $in: myProfile.concerns },
    })
      .limit(10)
      .lean();

    res.json(matches.map((m) => shapePeerSuggestion(
      m,
      m.concerns.filter((c) => myProfile.concerns.includes(c)),
    )));
  } catch (err) {
    console.error('Suggestions error:', err.message);
    res.status(500).json({ error: 'Failed to find suggested peers' });
  }
});

// ── POST /api/peers/connect/:userId ──────────────────────────────────────────
// Send a connection request
router.post('/connect/:userId', async (req, res) => {
  try {
    const recipientId = req.params.userId;
    if (String(recipientId) === String(req.user.id)) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    const myProfile = await Profile.findOne({ userId: req.user.id });
    const targetProfile = await Profile.findOne({ userId: recipientId });

    if (!targetProfile || !targetProfile.isPeerMatchingEnabled) {
      return res.status(404).json({ error: 'User is not available for matching' });
    }

    const shared = myProfile.concerns.filter((c) => targetProfile.concerns.includes(c));

    const conn = new PeerConnection({
        requester: req.user.id,
        recipient: recipientId,
        sharedConcerns: shared,
    });

    await conn.save();
    res.status(201).json({ success: true, status: conn.status });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Connection already exists' });
    }
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// ── GET /api/peers/requests ──────────────────────────────────────────────────
// List incoming and outgoing pending requests
router.get('/requests', async (req, res) => {
  try {
    const incoming = await PeerConnection.find({ recipient: req.user.id, status: 'pending' })
      .populate('requester', 'name email')
      .lean();
    const outgoing = await PeerConnection.find({ requester: req.user.id, status: 'pending' })
      .populate('recipient', 'name email')
      .lean();

    res.json(shapePeerRequestsResponse(incoming, outgoing));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ── PATCH /api/peers/requests/:requestId ─────────────────────────────────────
// Accept or Decline a request
router.patch('/requests/:requestId', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Invalid selection' });
    }

    const conn = await PeerConnection.findOne({
        _id: req.params.requestId,
        recipient: req.user.id,
        status: 'pending'
    });

    if (!conn) return res.status(404).json({ error: 'Request not found' });

    conn.status = status;
    await conn.save();

    res.json({ success: true, status: conn.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// ── GET /api/peers/list ───────────────────────────────────────────────────────
// List all current connections
router.get('/list', async (req, res) => {
  try {
    const conns = await PeerConnection.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
      status: 'accepted'
    })
    .populate('requester', 'name email')
    .populate('recipient', 'name email')
    .lean();

    res.json(conns.map(c => shapePeerConnection(c, req.user.id)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch peers' });
  }
});

module.exports = router;
