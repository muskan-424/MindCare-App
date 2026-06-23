/**
 * Set test env defaults and pre-download the in-memory MongoDB binary.
 * globalSetup runs in a separate process; env vars here do not carry into test
 * workers (testDb.js sets them again). Warming the binary cache avoids CI
 * timeouts on the first MongoMemoryServer.create() call.
 */
const { MongoBinary } = require('mongodb-memory-server');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.ADMIN_TOKEN = 'test_admin_token';
  process.env.USE_MOCK_CHATBOT = 'true';
  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';

  await MongoBinary.getPath();
};
