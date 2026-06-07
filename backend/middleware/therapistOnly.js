/**
 * therapistOnly middleware
 * Grants access only to users with therapist, clinician, admin, or super_admin roles.
 * Must be used AFTER the `auth` middleware which populates req.user.
 *
 * Usage:
 *   const { auth } = require('../middleware/auth');
 *   const therapistOnly = require('../middleware/therapistOnly');
 *   router.get('/secure-route', auth, therapistOnly, handler);
 */

const CLINICIAN_ROLES = ['therapist', 'clinician', 'admin', 'super_admin'];

function therapistOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!CLINICIAN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: Clinician role required' });
  }
  next();
}

module.exports = therapistOnly;
