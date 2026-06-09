/**
 * auditService.js
 * Fire-and-forget recorder for the audit trail. Never throws into the request
 * path — auditing must not break the action it is logging.
 */

const AuditLog = require('../models/AuditLog');

/** Pull a best-effort client IP from an Express request. */
function clientIp(req) {
  if (!req) return null;
  return (
    (req.headers && (req.headers['x-forwarded-for'] || '').split(',')[0].trim()) ||
    req.ip ||
    (req.connection && req.connection.remoteAddress) ||
    null
  );
}

/**
 * Record an audit event. Returns the promise but callers may ignore it.
 * @param {Object} p
 * @param {string} p.action               e.g. 'auth.login'
 * @param {string|null} [p.actorId]        user id performing the action
 * @param {string} [p.targetType]
 * @param {string} [p.targetId]
 * @param {Object} [req]                   Express request (for IP)
 * @param {Object} [p.meta]
 */
async function record({ action, actorId = null, targetType = null, targetId = null, meta } = {}, req = null) {
  try {
    if (!action) return null;
    return await AuditLog.create({
      action,
      actor: actorId || null,
      targetType,
      targetId: targetId != null ? String(targetId) : null,
      ip: clientIp(req),
      meta,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to record', action, '-', err.message);
    return null;
  }
}

module.exports = { record, clientIp };
