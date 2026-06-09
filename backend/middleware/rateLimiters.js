/**
 * rateLimiters.js
 * Centralized rate limiters. The global limiter protects all /api traffic;
 * the stricter auth limiter throttles credential endpoints (login, register,
 * password) to blunt brute-force and credential-stuffing attacks.
 */

const rateLimit = require('express-rate-limit');

const standardOpts = {
  standardHeaders: true,
  legacyHeaders: false,
};

// Global: generous ceiling for normal app usage.
const apiLimiter = rateLimit({
  ...standardOpts,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.', code: 'RATE_LIMITED' },
});

// Auth: tight limit to protect login / register / password endpoints.
const authLimiter = rateLimit({
  ...standardOpts,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts. Please wait and try again.', code: 'AUTH_RATE_LIMITED' },
  // Count only failures toward the limit so a logged-in user refreshing
  // a valid session isn't penalised.
  skipSuccessfulRequests: true,
});

module.exports = { apiLimiter, authLimiter };
