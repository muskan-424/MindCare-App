/**
 * Crisis Escalation SLA Monitor
 * ─────────────────────────────
 * Runs on a configurable interval. Finds HIGH/CRITICAL risk reports that:
 *   - Are still unverified (adminVerified: false)
 *   - Have NOT yet been escalated
 *   - Were submitted more than SLA_MINUTES ago
 *
 * When found, marks them as escalated so the Admin Dashboard can surface
 * them as urgent alerts at the top of the pending queue.
 *
 * SLA thresholds (configurable via env vars):
 *   CRITICAL reports → SLA_CRITICAL_MINUTES (default: 60 min)
 *   HIGH reports     → SLA_HIGH_MINUTES     (default: 240 min = 4 hrs)
 */

const IssueReport = require('../models/IssueReport');

const SLA_CRITICAL_MINUTES = parseInt(process.env.SLA_CRITICAL_MINUTES || '60', 10);
const SLA_HIGH_MINUTES = parseInt(process.env.SLA_HIGH_MINUTES || '240', 10);
const CHECK_INTERVAL_MS = parseInt(process.env.SLA_CHECK_INTERVAL_MS || '300000', 10); // 5 min default

let monitorInterval = null;

async function runSLACheck() {
  const now = new Date();

  try {
    // Build a query for reports that breach SLA
    const criticalCutoff = new Date(now.getTime() - SLA_CRITICAL_MINUTES * 60 * 1000);
    const highCutoff = new Date(now.getTime() - SLA_HIGH_MINUTES * 60 * 1000);

    // Find un-escalated, unverified HIGH/CRITICAL reports past their SLA window
    const breachedReports = await IssueReport.find({
      adminVerified: false,
      escalated: false,
      $or: [
        { riskLevel: 'CRITICAL', createdAt: { $lte: criticalCutoff } },
        { riskLevel: 'HIGH', createdAt: { $lte: highCutoff } },
      ],
    });

    if (breachedReports.length === 0) return;

    console.log(`[SLA Monitor] ⚠️  ${breachedReports.length} report(s) breached SLA threshold. Escalating...`);

    const updates = breachedReports.map(report => {
      const sla = report.riskLevel === 'CRITICAL' ? SLA_CRITICAL_MINUTES : SLA_HIGH_MINUTES;
      const minutesOverdue = Math.round((now - new Date(report.createdAt)) / 60000) - sla;
      return IssueReport.findByIdAndUpdate(report._id, {
        $set: {
          escalated: true,
          escalatedAt: now,
          slaBreachMinutes: minutesOverdue,
        },
      });
    });

    await Promise.all(updates);
    console.log(`[SLA Monitor] ✅ Escalated ${breachedReports.length} report(s).`);
  } catch (err) {
    console.error('[SLA Monitor] Error during SLA check:', err.message);
  }
}

function startSLAMonitor() {
  if (monitorInterval) return; // Already running
  console.log(`[SLA Monitor] Starting — CRITICAL SLA: ${SLA_CRITICAL_MINUTES}min | HIGH SLA: ${SLA_HIGH_MINUTES}min | Check every: ${CHECK_INTERVAL_MS / 60000}min`);
  // Run immediately on boot, then on interval
  runSLACheck();
  monitorInterval = setInterval(runSLACheck, CHECK_INTERVAL_MS);
}

function stopSLAMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

module.exports = { startSLAMonitor, stopSLAMonitor, runSLACheck };
