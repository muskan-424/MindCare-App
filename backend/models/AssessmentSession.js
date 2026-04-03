const mongoose = require('mongoose');

const AssessmentSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    triggerType: {
      type: String,
      enum: ['login_quick', 'scheduled_deep', 'risk_triggered'],
      default: 'login_quick',
    },
    status: {
      type: String,
      enum: ['started', 'collecting', 'ready_for_fusion', 'completed', 'failed', 'aborted'],
      default: 'started',
      index: true,
    },
    requiredModalities: {
      type: [String],
      default: ['text', 'voice', 'vision'],
    },
    completedModalities: {
      type: [String],
      default: [],
    },
    cameraConsent: { type: Boolean, default: false },
    micConsent: { type: Boolean, default: false },
    textConsent: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    failedReason: { type: String, default: '' },
  },
  { timestamps: true }
);

AssessmentSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AssessmentSession', AssessmentSessionSchema);
