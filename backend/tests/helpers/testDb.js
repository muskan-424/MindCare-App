/**
 * testDb.js
 * Points the app at the in-memory MongoDB from globalSetup and wires the env BEFORE the app
 * (and its config) are required. The order matters: config/env.js reads
 * process.env at module-load time, so env must be set first.
 *
 * Usage in a test file:
 *   const { startMemoryDb, getApp, clearDb, stopMemoryDb } = require('./helpers/testDb');
 *   let app;
 *   beforeAll(async () => { app = await startMemoryDb(); });
 *   afterEach(async () => { await clearDb(); });
 *   afterAll(async () => { await stopMemoryDb(); });
 */

async function waitForConnection(mongoose, timeoutMs = 30000) {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - start > timeoutMs) throw new Error('Timed out waiting for MongoDB connection');
    await new Promise(r => setTimeout(r, 100));
  }
}

/**
 * Start the in-memory DB, set env, require the Express app, and wait until
 * the app's own connectDB() has established a connection.
 * @returns {Promise<import('express').Express>}
 */
let appInstance = null;
// The mongoose instance the app connected with. A test that calls jest.resetModules()
// makes require('mongoose') return a fresh, unconnected copy, so keep this one.
let appMongoose = null;

async function startMemoryDb() {
  if (!process.env.TEST_MONGODB_URI) throw new Error('TEST_MONGODB_URI is not set; tests/globalSetup.js starts the in-memory MongoDB');
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.ADMIN_TOKEN = 'test_admin_token';
  process.env.USE_MOCK_CHATBOT = 'true'; // keep AI calls offline / rule-based
  // Force offline AI: set keys to '' BEFORE require so dotenv.config() (which
  // never overrides an existing env var) cannot inject real keys from .env.
  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';
  // Same for the ML server: keep assessments on fallback scoring, never a real server.
  process.env.ML_SERVER_URL = '';

  // Fresh module graph so config/env reads the test MONGODB_URI (not a stale cache).
  jest.resetModules();
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  appInstance = require('../../server');
  appMongoose = mongoose;
  await waitForConnection(mongoose);
  return appInstance;
}

async function clearDb() {
  const { collections } = appMongoose.connection;
  await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
}

async function stopMemoryDb() {
  if (appMongoose && appMongoose.connection.readyState !== 0) {
    await appMongoose.disconnect();
  }
  appMongoose = null;
  appInstance = null;
  jest.resetModules();
}

module.exports = { startMemoryDb, clearDb, stopMemoryDb };
