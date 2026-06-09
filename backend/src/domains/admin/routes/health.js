const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { config } = require('../../../../config/env');
const { client: redisClient } = require('../../../../config/redis');

let aiCapabilities = () => ({ geminiLive: false, mode: 'rule', ragMode: 'local' });
try {
  // Reuse Tink's capability reporter when available.
  aiCapabilities = require('../../community/services/tinkChatService').getCapabilities;
} catch (_) { /* keep default */ }

// ── GET /api/health ───────────────────────────────────────────────────────────
// Liveness: cheap, always 200 when the process is up.
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    env: config.env,
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// ── GET /api/health/ready ─────────────────────────────────────────────────────
// Readiness: 200 only when the DB is connected. Reports dependency status so
// load balancers / uptime checks can route traffic safely.
router.get('/ready', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  let redisStatus = 'disabled';
  try {
    if (config.redisUrl) redisStatus = redisClient && redisClient.isOpen ? 'up' : 'down';
  } catch (_) { redisStatus = 'unknown'; }

  let ai = {};
  try { ai = aiCapabilities(); } catch (_) { ai = { geminiLive: false, mode: 'rule' }; }

  const ready = dbConnected;
  res.status(ready ? 200 : 503).json({
    ready,
    checks: {
      database: dbConnected ? 'up' : 'down',
      redis: redisStatus,
      ai: ai.geminiLive ? 'gemini' : 'rule-based',
      rag: ai.ragMode || 'local',
    },
  });
});

module.exports = router;
