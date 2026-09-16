const express = require('express');
const axios = require('axios');
const router = express.Router();
const mongoose = require('mongoose');
const { config, getEnvStatus } = require('../../../../config/env');
const { client: redisClient } = require('../../../../config/redis');
const ML_SERVER = require('../../../shared/mlServerUrl');

let aiCapabilities = () => ({ geminiLive: false, mode: 'rule', ragMode: 'local' });
try {
  // Reuse Tink's capability reporter when available.
  aiCapabilities = require('../../community/services/tinkChatService').getCapabilities;
} catch (_) { /* keep default */ }

// ── GET /api/health ───────────────────────────────────────────────────────────
// Liveness: cheap, always 200 when the process is up.
router.get('/', (_req, res) => {
  const { ok, problems } = getEnvStatus();
  res.json({
    status: ok ? 'ok' : 'degraded',
    configOk: ok,
    configProblems: ok ? undefined : problems,
    env: config.env,
    version: '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    platform: process.env.VERCEL ? 'vercel' : process.env.RENDER ? 'render' : 'node',
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

// ── GET /api/health/ml ────────────────────────────────────────────────────────
// Whether the Python ML server is reachable and its models loaded. Separate from
// liveness/readiness because a sleeping free-tier ML server can take ~1 min to wake,
// and assessments fall back to heuristics without it rather than failing.
router.get('/ml', async (_req, res) => {
  if (!process.env.ML_SERVER_URL) {
    return res.json({ mlServer: 'not-configured', detail: 'ML_SERVER_URL is not set; assessments use fallback scoring' });
  }
  const started = Date.now();
  try {
    const { data } = await axios.get(`${ML_SERVER}/health`, { timeout: 90000 });
    const modelsLoaded = data.models_loaded || {};
    const allLoaded = Object.keys(modelsLoaded).length > 0 && Object.values(modelsLoaded).every(Boolean);
    res.status(allLoaded ? 200 : 503).json({
      mlServer: allLoaded ? 'up' : 'degraded',
      modelsLoaded,
      version: data.version,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    res.status(503).json({ mlServer: 'down', error: err.code || err.message, latencyMs: Date.now() - started });
  }
});

module.exports = router;
