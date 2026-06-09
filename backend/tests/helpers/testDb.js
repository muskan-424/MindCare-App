/**
 * testDb.js
 * Spins up an in-memory MongoDB for tests and wires the env BEFORE the app
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

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod = null;

async function waitForConnection(timeoutMs = 30000) {
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
async function startMemoryDb() {
  mongod = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.ADMIN_TOKEN = 'test_admin_token';
  process.env.USE_MOCK_CHATBOT = 'true'; // keep AI calls offline / rule-based
  // Force offline AI: set keys to '' BEFORE require so dotenv.config() (which
  // never overrides an existing env var) cannot inject real keys from .env.
  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';

  // Require AFTER env is set so config picks up the test values.
  const app = require('../../server');
  await waitForConnection();
  return app;
}

async function clearDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
}

async function stopMemoryDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

module.exports = { startMemoryDb, clearDb, stopMemoryDb };
