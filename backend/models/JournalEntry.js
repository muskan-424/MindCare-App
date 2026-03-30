const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
    // AI-generated fields (populated after save)
    sentimentScore: { type: Number, default: null },
    emotionTags: { type: [String], default: [] },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    aiInsight: { type: String, default: '' },
  },
  { timestamps: true }
);

JournalEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
