const express = require('express');
const router = express.Router();
const EmergencyContact = require('../models/EmergencyContact');
const { auth } = require('../middleware/auth');

// POST /api/emergency-contact — user submits/updates their emergency contact
router.post('/', auth, async (req, res) => {
  try {
    const { name, relationship, phone, reachVia, userMessage, consentGiven } = req.body;

    if (!name || !relationship || !phone) {
      return res.status(400).json({ error: 'name, relationship, and phone are required' });
    }
    if (!consentGiven) {
      return res.status(400).json({ error: 'Consent is required to store an emergency contact' });
    }

    // Basic phone validation
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    // Upsert — one contact per user
    const contact = await EmergencyContact.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          user: req.user.id,
          name: name.trim(),
          relationship,
          phone: cleanPhone,
          reachVia: reachVia || 'call',
          userMessage: userMessage?.trim() || '',
          consentGiven: true,
          status: 'awaiting_admin', // reset to awaiting each update for re-verification
          adminNote: '',
          rejectionReason: '',
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      id: String(contact._id),
      name: contact.name,
      relationship: contact.relationship,
      status: contact.status,
      message: 'Emergency contact submitted. An admin will verify it shortly.',
    });
  } catch (err) {
    console.error('Emergency contact submit error:', err.message);
    res.status(500).json({ error: 'Failed to save emergency contact' });
  }
});

// GET /api/emergency-contact — user gets their current contact status (masked phone)
router.get('/', auth, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({ user: req.user.id }).lean();
    if (!contact) return res.json({ exists: false });

    // Mask phone for privacy: +91-XXXXX-X5678
    const p = contact.phone;
    const masked = p.length > 4 ? p.slice(0, -4).replace(/\d/g, 'X') + p.slice(-4) : 'XXXX';

    res.json({
      exists: true,
      id: String(contact._id),
      name: contact.name,
      relationship: contact.relationship,
      phoneMasked: masked,
      reachVia: contact.reachVia,
      userMessage: contact.userMessage,
      status: contact.status,
      adminNote: contact.adminNote,
      rejectionReason: contact.rejectionReason,
      callLogCount: contact.callLog?.length || 0,
      lastCalledAt: contact.callLog?.length ? contact.callLog[contact.callLog.length - 1].calledAt : null,
    });
  } catch (err) {
    console.error('Get emergency contact error:', err.message);
    res.status(500).json({ error: 'Failed to get emergency contact' });
  }
});

// DELETE /api/emergency-contact — user revokes consent and removes contact
router.delete('/', auth, async (req, res) => {
  try {
    await EmergencyContact.findOneAndDelete({ user: req.user.id });
    res.json({ success: true, message: 'Emergency contact removed.' });
  } catch (err) {
    console.error('Delete emergency contact error:', err.message);
    res.status(500).json({ error: 'Failed to remove emergency contact' });
  }
});

module.exports = router;
