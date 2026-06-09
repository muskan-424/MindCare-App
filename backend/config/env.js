/**
 * config/env.js
 * Single, typed, validated source of truth for environment configuration.
 *
 * Goals:
 *  - Read every env var in ONE place (no scattered `process.env` reads).
 *  - Coerce types (numbers / booleans) consistently.
 *  - Fail fast in production when required secrets are missing or insecure.
 *
 * Usage:
 *   const { config } = require('./config/env');   // anywhere
 *   require('./config/env').validateEnv();         // once, at server boot
 */

const DEV_JWT_FALLBACK = 'dev_jwt_secret_change_me';

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const environment = process.env.NODE_ENV || 'development';
const isProd = environment === 'production';

const config = {
  env: environment,
  isProd,
  port: toInt(process.env.PORT, 5000),

  // Database
  mongoUri: process.env.MONGODB_URI || '',

  // Auth
  jwtSecret: process.env.JWT_SECRET || (isProd ? '' : DEV_JWT_FALLBACK),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Admin bootstrap / privileged endpoints
  adminToken: process.env.ADMIN_TOKEN || '',
  adminEmails: [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2]
    .filter(Boolean)
    .map(e => e.toLowerCase()),

  // Optional cache
  redisUrl: process.env.REDIS_URL || '',

  // AI / chatbot
  ai: {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null,
    useMockChatbot: toBool(process.env.USE_MOCK_CHATBOT, false),
    usePineconeRag: toBool(process.env.USE_PINECONE_RAG, false),
    defaultChatTone: process.env.DEFAULT_CHAT_TONE || 'friendly',
    // Model tiering: fast for classify/summary/short turns; quality for long/complex.
    fastModel: process.env.GEMINI_FAST_MODEL || 'gemini-flash-latest',
    qualityModel: process.env.GEMINI_QUALITY_MODEL || 'gemini-2.5-flash',
    complexityChars: toInt(process.env.GEMINI_COMPLEXITY_CHARS, 280),
    // Below this classification confidence, skip Gemini and return a rule reply + note.
    confidenceGate: Number(process.env.CHAT_CONFIDENCE_GATE) || 0.45,
    geminiTimeoutMs: toInt(process.env.GEMINI_TIMEOUT_MS, 15000),
    // Pinecone vector RAG (optional layer over local docs)
    pineconeApiKey: process.env.PINECONE_API_KEY || '',
    pineconeIndex: process.env.PINECONE_INDEX || 'mindcare-help',
    ragReindexIntervalMs: toInt(process.env.RAG_REINDEX_INTERVAL_MS, 86400000), // 24h
  },

  // SLA monitor
  sla: {
    criticalMinutes: toInt(process.env.SLA_CRITICAL_MINUTES, 60),
    highMinutes: toInt(process.env.SLA_HIGH_MINUTES, 240),
    checkIntervalMs: toInt(process.env.SLA_CHECK_INTERVAL_MS, 300000),
  },
};

// Vars that MUST be present (and secure) before serving production traffic.
const REQUIRED_IN_PROD = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_TOKEN'];

/**
 * Validate configuration. Throws in production on missing/insecure values;
 * only warns in non-production so local dev stays frictionless.
 * @returns {typeof config}
 */
function validateEnv() {
  const problems = [];

  for (const key of REQUIRED_IN_PROD) {
    if (!process.env[key]) problems.push(`${key} is required`);
  }

  // A real secret must be set in production — never ship the dev fallback.
  if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_JWT_FALLBACK)) {
    problems.push('JWT_SECRET must be set to a strong, non-default value');
  }

  if (problems.length) {
    const message = `[config] Environment problems:\n  - ${problems.join('\n  - ')}`;
    if (isProd) {
      throw new Error(message);
    }
    // eslint-disable-next-line no-console
    console.warn(`${message}\n[config] Continuing because NODE_ENV is "${environment}".`);
  }

  return config;
}

module.exports = { config, validateEnv, DEV_JWT_FALLBACK };
