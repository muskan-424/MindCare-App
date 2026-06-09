const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { config } = require('../../../../config/env');
const audit = require('../../admin/services/auditService');
const { shapeAuthResponse } = require('../../../shared/responseShapers');

const ADMIN_EMAILS = config.adminEmails;

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
        audit.record({ action: 'auth.login_failed', actorId: user._id, meta: { email } }, req);
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

      const isAdmin =
        ADMIN_EMAILS.length > 0 &&
        ADMIN_EMAILS.includes((user.email || '').toLowerCase());
      const role = isAdmin ? 'admin' : (user.role || 'user');

      let therapistListing = null;
      if (role === 'clinician') {
        const Therapist = require('../../therapy/models/Therapist');
        therapistListing = await Therapist.findOne({ userId: user._id }).lean();
      }

      const payload = {
        user: {
          id: user._id,
          role,
        },
      };
      const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });

      audit.record({ action: 'auth.login', actorId: user._id, targetType: 'User', targetId: user._id, meta: { role } }, req);

      const response = shapeAuthResponse({ token, user, profile });
      response.user.role = role;
      if (therapistListing) response.user.specialisation = therapistListing.specialisation;
      res.json(response);
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset OTP
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't leak whether user exists, just return success
      return res.status(200).json({ success: true, message: 'If that user exists, we have sent a reset code.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // In a real app, send email here. For dev, log it.
    console.log(`\n===================================`);
    console.log(`🔐 PASSWORD RESET OTP GENERATED`);
    console.log(`USER: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`===================================\n`);

    res.status(200).json({ success: true, message: 'Password reset code has been sent (see backend console).' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password successfully reset.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
