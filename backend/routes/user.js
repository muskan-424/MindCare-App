const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Profile = require('../models/Profile');

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

    const { name, email, password, age, gender, phone_no } = req.body;

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
      console.error('Register error:', err.message);
      res.status(500).json({ errors: [{ msg: 'Server error' }] });
    }
  }
);

module.exports = router;
