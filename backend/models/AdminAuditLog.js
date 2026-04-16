const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },           // who did the action
    action: { type: String, required: true },            // e.g. "verify_risk_report"
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra context
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
