const crypto = require('crypto');

/**
 * requestLogger
 * Emits one structured JSON line per request with a correlation id. Logs only
 * metadata (method, path, status, duration, user id) — never request bodies —
 * so secrets/PII are not written to logs. Sets `req.id` and the
 * `X-Request-Id` response header for end-to-end tracing.
 */
function requestLogger(req, res, next) {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-Id', reqId);

  // Stay silent during tests to keep CI output readable.
  if (process.env.NODE_ENV === 'test') return next();

  const start = Date.now();

  res.on('finish', () => {
    const entry = {
      ts: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      reqId,
      method: req.method,
      path: (req.originalUrl || req.url || '').split('?')[0],
      status: res.statusCode,
      durationMs: Date.now() - start,
      userId: (req.user && req.user.id) || null,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  });

  next();
}

module.exports = { requestLogger };
