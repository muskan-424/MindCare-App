require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();

// Trust Vercel's reverse proxy so rate limiting identifies true client IPs
app.set('trust proxy', 1);

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet()); // Adds secure HTTP headers (XSS protection, no-sniff, etc.)

// Global Rate Limiting: Max 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, 
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply rate limiter to all /api routes
app.use('/api', apiLimiter);


// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);

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
app.use('/api/peers', require('./src/domains/community/routes/peers'));
app.use('/api/institutions', require('./src/domains/identity/routes/institutions'));
app.use('/api/aiIntake', require('./src/domains/assessment/routes/aiIntake'));
app.use('/api/analytics', require('./src/domains/admin/routes/analytics'));

// ─── Local Dev Server ─────────────────────────────────────────────────────────
// When running locally (node server.js / npm run dev), start the HTTP server
// AND the SLA monitor background job. On Vercel, this block is skipped because
// Vercel imports this file as a module and does not call it as a script.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n===================================');
    console.log(`✅ MindCare API running on port ${PORT}`);
    console.log('===================================\n');

    // SLA monitor only runs in traditional server mode (not serverless)
    const { startSLAMonitor } = require('./src/domains/admin/services/slaMonitor');
    startSLAMonitor();
  });
}

// ─── Export for Vercel ────────────────────────────────────────────────────────
module.exports = app;
