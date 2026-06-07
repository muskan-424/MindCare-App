const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone_no: {
      type: String,
      default: '',
    },
    age: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', ''],
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    concerns: {
      type: [String],
      default: [],
    },
    isPeerMatchingEnabled: {
      type: Boolean,
      default: false,
    },
    peerBio: {
      type: String,
      default: '',
    },
    // Psychometric / Analytics fields
    sleepQuality: { type: Number, default: 3 },
    academicStress: { type: Number, default: 3 },
    anxietyLevel: { type: Number, default: 2 },
    depressionLevel: { type: Number, default: 2 },
    stressLevel: { type: Number, default: 3 },
    activityLevel: { type: Number, default: 3 },
    socialInteraction: { type: Number, default: 3 },
    profilePic: { type: String, default: '' },
  },
  { timestamps: true }

);

module.exports = mongoose.model('Profile', ProfileSchema);
