const BaseNotificationProvider = require('./BaseNotificationProvider');

/**
 * ConsoleNotificationProvider
 * Default, dependency-free provider. Logs the notification instead of sending
 * it — ideal for dev/demo and for tests. Swap for an email/push provider in
 * production by setting NOTIFICATION_PROVIDER.
 */
class ConsoleNotificationProvider extends BaseNotificationProvider {
  async send({ to, title, body } = {}) {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(`[notify:console] → ${to} | ${title} — ${body}`);
    }
    return { ok: true, id: `console-${Date.now()}` };
  }
}

module.exports = ConsoleNotificationProvider;
