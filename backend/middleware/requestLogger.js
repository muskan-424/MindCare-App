function requestLogger(req, res, next) {
  const start = Date.now();

  console.log(
    '[BACKEND REQUEST]',
    req.method,
    req.originalUrl,
    '\n  query:',
    req.query || null,
    '\n  body:',
    req.body || null,
  );

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      '[BACKEND RESPONSE]',
      req.method,
      req.originalUrl,
      '\n  status:',
      res.statusCode,
      '\n  durationMs:',
      duration,
    );
  });

  next();
}

module.exports = { requestLogger };

