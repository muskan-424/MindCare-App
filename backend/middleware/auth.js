const jwt = require('jsonwebtoken');

/**
 * Auth middleware — verifies JWT sent in Authorization header.
 * Attaches req.user = { id, role } on success.
 */
function auth(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me');
    req.user = decoded.user; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is not valid' });
  }
}

/**
 * Admin-only middleware — must be used after `auth`.
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { auth, adminOnly };
