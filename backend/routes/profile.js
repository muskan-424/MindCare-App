const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const DeletionRequest = require('../models/DeletionRequest');
const { auth } = require('../middleware/auth');

// @route   POST /api/profile/add-concerns
// @desc    Update user concerns
// @access  Public
router.post('/add-concerns', auth, async (req, res) => {
  const { concerns, uid } = req.body;

  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: uid },
      { $set: { concerns } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ errors: [{ msg: 'Profile not found' }] });
    }

    res.json(profile);
  } catch (err) {
    console.error('Update concerns error:', err.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

// @route   POST /api/profile/edit-profile
// @desc    Edit user profile
// @access  Public
router.post('/edit-profile', auth, async (req, res) => {
  const { name, email, phone_no, age, gender, concerns, uid } = req.body;

  try {
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone_no !== undefined) updateFields.phone_no = phone_no;
    if (age !== undefined) updateFields.age = age;
    if (gender !== undefined) updateFields.gender = gender;
    if (concerns !== undefined) updateFields.concerns = concerns;

    const profile = await Profile.findOneAndUpdate(
      { userId: uid },
      { $set: updateFields },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ errors: [{ msg: 'Profile not found' }] });
    }

    res.json(profile);
  } catch (err) {
    console.error('Edit profile error:', err.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

// @route   POST /api/profile/delete-request
// @desc    Submit account deletion request
// @access  Private
router.post('/delete-request', auth, async (req, res) => {
  try {
    const { reason, uid } = req.body;
    if (!reason) return res.status(400).json({ error: 'Please provide a reason for deletion' });

    // Ensure user matches auth token
    if (req.user.id !== uid) return res.status(403).json({ error: 'Unauthorized' });

    // Upsert the request in case they already submitted one
    const request = await DeletionRequest.findOneAndUpdate(
      { user: uid },
      { $set: { reason, status: 'pending' } },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Deletion request submitted', request });
  } catch (err) {
    console.error('Delete request error:', err.message);
    res.status(500).json({ error: 'Failed to submit deletion request' });
  }
});

module.exports = router;
