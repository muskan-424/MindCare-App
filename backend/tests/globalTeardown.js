/**
 * Stop the shared in-memory MongoDB and background jobs after all suites finish.
 */
const { stopGlobalMongo } = require('./helpers/testDb');

module.exports = async () => {
  await stopGlobalMongo();
};
