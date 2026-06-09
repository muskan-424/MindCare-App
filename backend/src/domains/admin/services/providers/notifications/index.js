/**
 * Notification provider factory.
 * Selects a concrete provider from NOTIFICATION_PROVIDER (default: console) and
 * caches a singleton. Add new providers (email, fcm, sns…) by registering them
 * in the map below — callers keep using getNotificationProvider().send().
 */
const ConsoleNotificationProvider = require('./ConsoleNotificationProvider');

const PROVIDERS = {
  console: ConsoleNotificationProvider,
  // email: require('./EmailNotificationProvider'),
  // push:  require('./PushNotificationProvider'),
};

let instance = null;

function getNotificationProvider() {
  if (instance) return instance;
  const key = (process.env.NOTIFICATION_PROVIDER || 'console').toLowerCase();
  const Provider = PROVIDERS[key] || ConsoleNotificationProvider;
  if (!PROVIDERS[key]) {
    // eslint-disable-next-line no-console
    console.warn(`[notify] unknown NOTIFICATION_PROVIDER "${key}", falling back to console`);
  }
  instance = new Provider();
  return instance;
}

/** Test/util helper to clear the cached singleton. */
function _resetProvider() {
  instance = null;
}

module.exports = { getNotificationProvider, _resetProvider };
