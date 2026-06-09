const mongoose = require('mongoose');

/**
 * AuditLog — an append-only trail of security/privacy-sensitive actions.
 * For a mental-health app this matters for compliance: who logged in, who
 * accessed patient data, crisis events, and account/data deletion.
 *
 * Rows are write-once (never updated). Keep `meta` free of secrets/PII beyond
 * what is necessary to investigate an incident.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    // Null for anonymous / pre-auth events (e.g. failed login).
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: { type: String, required: true, index: true }, // e.g. 'auth.login', 'chat.crisis'
    targetType: { type: String, default: null }, // e.g. 'User', 'Conversation'
    targetId: { type: String, default: null },
    ip: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
