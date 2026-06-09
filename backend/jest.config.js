module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // mongodb-memory-server may download a binary on first run.
  testTimeout: 60000,
  // Run test files serially to avoid multiple in-memory Mongo instances racing.
  maxWorkers: 1,
  verbose: true,
};
