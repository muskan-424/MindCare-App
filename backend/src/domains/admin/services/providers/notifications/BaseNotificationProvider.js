/**
 * BaseNotificationProvider
 * Contract every notification backend (console, email, push, SMS…) must
 * implement. Callers depend on this interface, not a concrete provider, so the
 * transport can be swapped via config without touching business logic.
 */
class BaseNotificationProvider {
  /**
   * @param {Object} msg
   * @param {string} msg.to     recipient identifier (email, deviceId, userId…)
   * @param {string} msg.title  short heading
   * @param {string} msg.body   message body
   * @param {Object} [msg.data] optional structured payload
   * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async send(msg) {
    throw new Error('send() not implemented by notification provider');
  }

  /** Human-readable provider name, for logs/health. */
  get name() {
    return this.constructor.name;
  }
}

module.exports = BaseNotificationProvider;
