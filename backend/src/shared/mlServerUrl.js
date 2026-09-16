// Base URL of the Python ML server (ml/server.py). Defaults to local dev;
// set ML_SERVER_URL in production once the ML server is deployed separately.
// Trailing slashes are dropped so "https://host/" doesn't produce "//analyze/..." paths.
module.exports = (process.env.ML_SERVER_URL || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
