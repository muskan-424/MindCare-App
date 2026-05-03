const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { generateEmotionalFingerprint } = require('../services/ai/emotionalFingerprintService');

// @route   GET /api/analytics/fingerprint
// @desc    Get personalized emotional pattern fingerprint
// @access  Private
router.get('/fingerprint', auth, async (req, res) => {
  try {
    const fingerprint = await generateEmotionalFingerprint(req.user.id);
    res.json(fingerprint);
  } catch (err) {
    console.error('Fingerprint route error:', err.message);
    res.status(500).json({ error: 'Failed to generate emotional fingerprint' });
  }
});

module.exports = router;
