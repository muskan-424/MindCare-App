require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { validateEnv, getEnvStatus } = require('./config/env');
const { requestLogger } = require('./middleware/requestLogger');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { metricsMiddleware } = require('./middleware/metrics');

// Validate configuration before doing anything else.
// On Vercel, missing secrets defer to 503 responses instead of crashing cold start.
const envCheck = validateEnv();

const app = express();

// Trust Vercel's reverse proxy so rate limiting identifies true client IPs
app.set('trust proxy', 1);

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet()); // Adds secure HTTP headers (XSS protection, no-sniff, etc.)

// Global rate limit for all /api traffic; stricter limit on credential routes.
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/user', authLimiter);


// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(metricsMiddleware);

// Block API traffic when required env vars are missing (serverless-friendly boot).
if (!envCheck.ok) {
  app.use((req, res, next) => {
    const path = req.originalUrl.split('?')[0];
    const exempt = ['/', '/api/health', '/api/health/ready', '/api/docs/openapi.json'];
    if (exempt.includes(path) || path.startsWith('/api/docs')) return next();
    const { problems } = getEnvStatus();
    return res.status(503).json({
      error: 'API not configured — set required environment variables in the deployment dashboard',
      code: 'CONFIG_INVALID',
      details: problems,
    });
  });
}

// ─── DB Connection ────────────────────────────────────────────────────────────
// Called on every cold start. On warm invocations, connectDB returns
// the cached connection immediately (see config/db.js).
connectDB().catch(err =>
  console.error('MongoDB connection failed:', err.message)
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'MindCare API is running', version: '1.0.0' });
});

// ─── Observability ────────────────────────────────────────────────────────────
app.use('/api/health', require('./src/domains/admin/routes/health'));
app.use('/api/metrics', require('./src/domains/admin/routes/metrics'));
app.use('/api/docs', require('./src/domains/admin/routes/docs'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/user', require('./src/domains/identity/routes/user'));
app.use('/api/auth', require('./src/domains/identity/routes/auth'));
app.use('/api/profile', require('./src/domains/identity/routes/profile'));
app.use('/api/quotes', require('./src/domains/content/routes/quotes'));
app.use('/api/chat', require('./src/domains/community/routes/chat'));
app.use('/api/fitness', require('./src/domains/wellness/routes/fitness'));
app.use('/api/content', require('./src/domains/content/routes/content'));
app.use('/api/blogs', require('./src/domains/community/routes/blogs'));
app.use('/api/home', require('./src/domains/content/routes/home'));
app.use('/api/journals', require('./src/domains/wellness/routes/journals'));
app.use('/api/therapists', require('./src/domains/therapy/routes/therapists'));
app.use('/api/issues', require('./src/domains/admin/routes/issues'));
app.use('/api/mood', require('./src/domains/wellness/routes/mood'));
app.use('/api/admin', require('./src/domains/admin/routes/admin'));
app.use('/api/appointments', require('./src/domains/therapy/routes/appointments'));
app.use('/api/emergency-contact', require('./src/domains/admin/routes/emergencyContact'));
app.use('/api/wellness', require('./src/domains/wellness/routes/wellness'));
app.use('/api/resources', require('./src/domains/content/routes/resources'));
app.use('/api/groups', require('./src/domains/community/routes/groups'));
app.use('/api/goals', require('./src/domains/wellness/routes/goals'));
app.use('/api/streaks', require('./src/domains/wellness/routes/streaks'));
app.use('/api/peers', require('./src/domains/community/routes/peers'));
app.use('/api/institutions', require('./src/domains/identity/routes/institutions'));
app.use('/api/aiIntake', require('./src/domains/assessment/routes/aiIntake'));
app.use('/api/analytics', require('./src/domains/admin/routes/analytics'));

// ─── 404 + Central Error Handler (must be last) ───────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Local Dev Server ─────────────────────────────────────────────────────────
// When running locally (node server.js / npm run dev), start the HTTP server
// AND the SLA monitor background job. On Vercel, this block is skipped because
// Vercel imports this file as a module and does not call it as a script.
if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);

  // WebSocket chat — only on long-lived servers (not Vercel serverless).
  const { attachChatWebSocket } = require('./src/domains/community/ws/chatWs');
  attachChatWebSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n===================================');
    console.log(`✅ MindCare API running on port ${PORT}`);
    console.log(`✅ WebSocket chat at ws://localhost:${PORT}/api/chat/ws`);
    console.log('===================================\n');

    const { startBackgroundJobs } = require('./jobs');
    startBackgroundJobs();
  });
}

// ─── Export for Vercel ────────────────────────────────────────────────────────
module.exports = app;
