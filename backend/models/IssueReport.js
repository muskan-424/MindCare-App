const mongoose = require('mongoose');

const IssueReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    severity: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, default: '' },
    moodTag: { type: String, default: '' },
    sentimentScore: { type: Number, default: null },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    emotionTags: [{ type: String }],
    recommendations: [{ type: String }],
    safetyTriggered: { type: Boolean, default: false },
    // Admin review fields
    adminVerified: { type: Boolean, default: false },
    adminNote: { type: String, default: '' },
    adminAction: { type: String, enum: ['none', 'contacted', 'referred', 'resolved'], default: 'none' },
    assignedResources: [{
      title: { type: String },
      type: { type: String, enum: ['video', 'article', 'exercise'] },
      url: { type: String }
    }],
    // SLA / Escalation fields
    escalated: { type: Boolean, default: false },
    escalatedAt: { type: Date, default: null },
    slaBreachMinutes: { type: Number, default: null }, // how long it was overdue when flagged
  },
  { timestamps: true }
);

IssueReportSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('IssueReport', IssueReportSchema);
