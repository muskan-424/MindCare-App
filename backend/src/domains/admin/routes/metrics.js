const express = require('express');
const router = express.Router();
const { snapshot, toPrometheus } = require('../../../../middleware/metrics');

// ── GET /api/metrics ──────────────────────────────────────────────────────────
// Request metrics for monitoring. Returns JSON by default, or Prometheus text
// when `?format=prometheus` (or an Accept header asking for text/plain).
router.get('/', (req, res) => {
  const wantsProm = req.query.format === 'prometheus' || /text\/plain/.test(req.headers.accept || '');
  if (wantsProm) {
    res.set('Content-Type', 'text/plain; version=0.0.4');
    return res.send(toPrometheus());
  }
  res.json(snapshot());
});

module.exports = router;
