/**
 * jobs/index.js
 * Registers background job handlers and starts their schedules.
 * Call startBackgroundJobs() once from a long-lived server process only
 * (skip it on serverless platforms where intervals never fire reliably).
 */

const jobQueue = require('./jobQueue');
const { config } = require('../config/env');
const { runSLACheck } = require('../src/domains/admin/services/slaMonitor');
const { reindexHelpDocs } = require('../src/domains/community/services/tinkRagService');

const SLA_CHECK_INTERVAL_MS = config.sla.checkIntervalMs;

// Register handlers
jobQueue.register('sla.check', runSLACheck);
jobQueue.register('rag.reindex', async () => {
  const result = await reindexHelpDocs();
  if (result.upserted) {
    // eslint-disable-next-line no-console
    console.log(`[jobs] rag.reindex upserted ${result.upserted} doc(s)`);
  }
});

let started = false;

function startBackgroundJobs() {
  if (started) return;
  started = true;
  // Run once on boot, then every interval.
  jobQueue.schedule('sla.check', SLA_CHECK_INTERVAL_MS, {}, true);
  if (config.ai.usePineconeRag && config.ai.pineconeApiKey) {
    jobQueue.schedule('rag.reindex', config.ai.ragReindexIntervalMs, {}, true);
  }
  // eslint-disable-next-line no-console
  console.log(`[jobs] background jobs started — sla.check every ${SLA_CHECK_INTERVAL_MS / 60000}min`);
}

function stopBackgroundJobs() {
  jobQueue.stopAll();
  started = false;
}

module.exports = { startBackgroundJobs, stopBackgroundJobs, jobQueue };
