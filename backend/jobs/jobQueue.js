/**
 * jobQueue.js
 * A tiny in-process job queue + periodic scheduler. Decouples background work
 * (SLA checks, reminders, reindexing) from the request cycle. Designed to be
 * swapped for Redis/BullMQ later without changing callers.
 *
 * Not started in serverless mode — see jobs/index.js + server.js.
 */

const handlers = new Map(); // name -> async (payload) => void
const queue = [];
const timers = [];
let draining = false;

/** Register a handler for a job name. */
function register(name, handler) {
  handlers.set(name, handler);
}

/** Add a job to the queue (processed asynchronously). */
function enqueue(name, payload = {}) {
  queue.push({ name, payload });
  setImmediate(drain);
}

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (queue.length) {
      const job = queue.shift();
      const handler = handlers.get(job.name);
      if (!handler) {
        // eslint-disable-next-line no-console
        console.warn(`[jobs] no handler registered for "${job.name}"`);
        continue;
      }
      try {
        await handler(job.payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[jobs] job "${job.name}" failed:`, err.message);
      }
    }
  } finally {
    draining = false;
  }
}

/**
 * Run a job on a fixed interval. Returns the timer handle.
 * @param {boolean} [runImmediately=false] enqueue once right away.
 */
function schedule(name, intervalMs, payload = {}, runImmediately = false) {
  if (runImmediately) enqueue(name, payload);
  const timer = setInterval(() => enqueue(name, payload), intervalMs);
  if (typeof timer.unref === 'function') timer.unref(); // don't keep the process alive
  timers.push(timer);
  return timer;
}

/** Stop all scheduled jobs (used on shutdown / tests). */
function stopAll() {
  while (timers.length) clearInterval(timers.pop());
}

module.exports = { register, enqueue, schedule, stopAll, drain, _handlers: handlers };
