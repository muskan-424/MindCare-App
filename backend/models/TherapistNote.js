const mongoose = require('mongoose');

const TherapistNoteSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Progress', 'Clinical', 'Crisis', 'Follow-up'],
      default: 'Progress',
    },
    confidentialityLevel: {
      type: Number,
      default: 1, // 1: Low, 2: Medium, 3: High
    },
  },
  { timestamps: true }
);

// Index to quickly find notes for a specific patient by their current therapist
TherapistNoteSchema.index({ patient: 1, therapist: 1, sessionDate: -1 });

module.exports = mongoose.model('TherapistNote', TherapistNoteSchema);
