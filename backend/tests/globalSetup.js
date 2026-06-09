/**
 * Set test env defaults before any suite loads config/server modules.
 */
module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.ADMIN_TOKEN = 'test_admin_token';
  process.env.USE_MOCK_CHATBOT = 'true';
  process.env.GEMINI_API_KEY = '';
  process.env.GOOGLE_API_KEY = '';
};
