const mongoose = require('mongoose');

const ModalityFeatureSchema = new mongoose.Schema(
  {
    confidence: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0 },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    features: { type: mongoose.Schema.Types.Mixed, default: {} },
    modelVersion: { type: String, default: 'v1-stub' },
  },
  { _id: false }
);

const AssessmentFeatureVectorSchema = new mongoose.Schema(
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
    text: { type: ModalityFeatureSchema, default: () => ({}) },
    voice: { type: ModalityFeatureSchema, default: () => ({}) },
    vision: { type: ModalityFeatureSchema, default: () => ({}) },
    rawRefs: {
      textResponseCount: { type: Number, default: 0 },
      latestVoiceRef: { type: String, default: '' },
      latestVisionRef: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssessmentFeatureVector', AssessmentFeatureVectorSchema);
