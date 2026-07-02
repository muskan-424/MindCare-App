const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { config } = require('../../../../config/env');
const { shapeAuthResponse, shapeBroadcastNotifications } = require('../../../shared/responseShapers');
const Notification = require('../../admin/models/Notification');
const { localizeNotifications } = require('../../../shared/notificationLocalization');

// @route   POST /api/user
// @desc    Register a new user
// @access  Public
router.post(
  '/',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, age, gender, phone_no, role, specialisation } = req.body;

    try {
      // Check if user already exists
      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        age: age || '',
        gender: gender || '',
        role: role === 'clinician' ? 'clinician' : 'user',
      });
      await user.save();

      // Create profile
      const profile = new Profile({
        userId: user._id,
        name,
        email,
        age: age || '',
        gender: gender || '',
        phone_no: phone_no || '',
        bio: '',
        concerns: [],
      });
      await profile.save();

      // Create or link Therapist listing if role is clinician
      if (user.role === 'clinician') {
        const Therapist = require('../../therapy/models/Therapist');
        try {
          const existing = await Therapist.findOne({ email: user.email });
          if (existing) {
             existing.userId = user._id;
             if (specialisation) existing.specialisation = specialisation;
             await existing.save();
          } else {
             const newTherapist = new Therapist({
                name: user.name,
                email: user.email,
                specialisation: specialisation || 'Psychologist', // Default fallback
                userId: user._id,
                active: true,
             });
             await newTherapist.save();
          }
        } catch (linkErr) {
          console.error('Therapist creation/link error:', linkErr.message);
        }
      }

      const payload = {
        user: {
          id: user._id,
          role: user.role,
        },
      };
      const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      res.json(shapeAuthResponse({ token, user, profile }));
    } catch (err) {
      console.error('Register error:', err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

// GET /api/user/notifications — fetch admin broadcasts for users
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({
      audience: { $in: ['all_users', 'therapists'] },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const shaped = shapeBroadcastNotifications(notifications);
    const localized = await localizeNotifications(shaped, req.language);
    res.json(localized);
  } catch (err) {
    console.error('Fetch notifications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;

