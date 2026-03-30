const mongoose = require('mongoose');

const EmergencyContactSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true }, // e.g. 'Parent', 'Friend'
    phone: { type: String, required: true, trim: true },
    reachVia: { type: String, enum: ['call', 'whatsapp', 'both'], default: 'call' },
    userMessage: { type: String, default: '' }, // context note for admin to read before calling
    consentGiven: { type: Boolean, required: true },

    // Admin fields
    status: {
      type: String,
      enum: ['awaiting_admin', 'verified', 'rejected'],
      default: 'awaiting_admin',
    },
    adminNote: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },

    // Crisis log — every time admin used this contact
    callLog: [
      {
        calledAt: { type: Date, default: Date.now },
        outcome: { type: String }, // 'reached', 'no_answer', 'voicemail', 'referred'
        adminNote: { type: String, default: '' },
        triggeredBy: { type: String, default: '' }, // IssueReport or JournalEntry id
      },
    ],
  },
  { timestamps: true }
);

EmergencyContactSchema.index({ user: 1 });
EmergencyContactSchema.index({ status: 1 });

module.exports = mongoose.model('EmergencyContact', EmergencyContactSchema);
