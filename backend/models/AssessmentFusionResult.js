const mongoose = require('mongoose');

const AssessmentFusionResultSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentSession',
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    riskScore: { type: Number, required: true },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    confidence: { type: Number, default: 0 },
    contradictionFlags: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    modelVersion: { type: String, default: 'fusion-v1-stub' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssessmentFusionResult', AssessmentFusionResultSchema);
