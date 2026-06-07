const mongoose = require('mongoose');

const GroupSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    meetingLink: { type: String, required: true }, // Platform-agnostic link (Zoom, Meet, embedded)
    maxParticipants: { type: Number, default: 10 },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users assigned by Admin
    facilitatorName: { type: String, default: 'MindCare Team' }, // Admin or Therapist leading
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroupSession', GroupSessionSchema);
