const mongoose = require('mongoose');

const TherapistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialisation: { type: String, required: true, trim: true },
    img: { type: String, default: '' },
    bio: { type: String, default: '' },
    email: { type: String, default: '', trim: true },
    contact_no: { type: String, default: '' },
    timing: { type: String, default: '' },
    fee: { type: String, default: '' },
    stars: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, sparse: true },
  },
  { timestamps: true }
);

TherapistSchema.index({ active: 1, name: 1 });

module.exports = mongoose.model('Therapist', TherapistSchema);

