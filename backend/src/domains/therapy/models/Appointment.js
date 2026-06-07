const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // User fills these at request time
    requestedSpeciality: { type: String, default: '' }, // e.g. 'Psychologist'
    preferredDates: { type: [String], default: [] },    // user's preferred date range
    preferredTime: { type: String, default: '' },        // 'morning' | 'afternoon' | 'evening' | 'any'
    userNote: { type: String, default: '' },             // what they need help with

    // Admin fills these after reviewing
    therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', default: null },
    date: { type: String, default: '' },
    timeSlot: { type: String, default: '' },
    adminNote: { type: String, default: '' },           // note from admin to user

    status: {
      type: String,
      enum: ['awaiting_admin', 'pending', 'confirmed', 'cancelled', 'completed'],
      default: 'awaiting_admin',
    },
  },
  { timestamps: true }
);

AppointmentSchema.index({ user: 1, status: 1 });
AppointmentSchema.index({ therapist: 1, date: 1 });
AppointmentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
