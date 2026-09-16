/**
 * Start one in-memory MongoDB for the whole run and set test env defaults.
 * globalSetup and globalTeardown share a context, so the server handle kept on
 * globalThis here is the one teardown stops. Test files get their own globals,
 * so they read the URI from process.env instead (inherited by test workers).
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.ADMIN_TOKEN = 'test_admin_token';
  process.env.USE_MOCK_CHATBOT = 'true';
  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';

  globalThis.__MONGOD__ = await MongoMemoryServer.create({
    instance: { launchTimeout: 120000 },
  });
  process.env.TEST_MONGODB_URI = globalThis.__MONGOD__.getUri();
};
