/**
 * __mocks__/@env.js
 *
 * Jest mock for all @env variables.
 * The real values are loaded by react-native-dotenv at Metro/Babel build time.
 * In Jest (Node environment) we provide safe test values here.
 */
module.exports = {
  GOOGLE_API_KEY: 'test-google-api-key',
  ADMIN_TOKEN: 'test-admin-token',
  ADMIN_EMAIL_1: 'admin@test.com',
};
