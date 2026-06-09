/**
 * errorHandler.js
 * Central error handling for the API. Mount AFTER all routes:
 *   app.use(notFound);
 *   app.use(errorHandler);
 *
 * Produces a consistent error shape: { error, code, details? }.
 * Routes can throw/`next()` an error with `.status`, `.code`, `.publicMessage`,
 * and `.details` to control the response; anything else becomes a 500.
 */

const { config } = require('../config/env');

function notFound(req, res, _next) {
  res.status(404).json({
    error: 'Resource not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // If the response has already started streaming, defer to Express.
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const isServerError = status >= 500;

  const payload = {
    error: err.publicMessage || (isServerError ? 'Internal server error' : err.message) || 'Request failed',
    code: err.code || (isServerError ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
  };

  // express-validator style details, or any explicitly attached details.
  if (err.details) payload.details = err.details;
  if (Array.isArray(err.errors)) payload.details = err.errors;

  if (isServerError) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', req.method, req.originalUrl, '-', err.message);
    if (!config.isProd && err.stack) payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

/**
 * Helper to create an error with an HTTP status + machine code.
 * @example throw httpError(404, 'Goal not found', 'GOAL_NOT_FOUND');
 */
function httpError(status, message, code, details) {
  const err = new Error(message);
  err.status = status;
  err.publicMessage = message;
  if (code) err.code = code;
  if (details) err.details = details;
  return err;
}

module.exports = { notFound, errorHandler, httpError };
