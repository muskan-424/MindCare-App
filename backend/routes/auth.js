const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');

// @route   POST /api/auth
// @desc    Login user
// @access  Public
router.post(
  '/',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Get profile
      let profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        // Create profile if it doesn't exist (backward compatibility)
        profile = new Profile({
          userId: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          gender: user.gender,
          phone_no: '',
          bio: '',
          concerns: [],
        });
        await profile.save();
      }

      // Return user + profile (matching frontend expectation)
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          age: user.age,
          gender: user.gender,
        },
        profile: {
          _id: profile._id,
          userId: profile.userId,
          name: profile.name,
          email: profile.email,
          phone_no: profile.phone_no,
          age: profile.age,
          gender: profile.gender,
          bio: profile.bio,
          concerns: profile.concerns,
        },
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
