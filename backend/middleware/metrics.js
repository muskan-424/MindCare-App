/**
 * metrics.js
 * Lightweight in-process request metrics (no external dependency).
 * Tracks request counts, latency, and status classes per route, plus a
 * rolling process view. Exposed via GET /api/metrics (JSON or Prometheus text).
 *
 * Route keys use the matched Express route pattern (e.g. "GET /api/goals/:id")
 * rather than the raw URL, to keep label cardinality bounded.
 */

const store = {
  startedAt: Date.now(),
  total: 0,
  inFlight: 0,
  statusClasses: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  routes: new Map(), // key -> { count, totalMs, maxMs, errors }
};

function routeKey(req) {
  const base = req.baseUrl || '';
  const path = (req.route && req.route.path) || '';
  const combined = `${base}${path}`.replace(/\/$/, '') || req.path || 'unmatched';
  return `${req.method} ${combined}`;
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  store.inFlight += 1;

  res.on('finish', () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    store.inFlight = Math.max(0, store.inFlight - 1);
    store.total += 1;

    const cls = `${Math.floor(res.statusCode / 100)}xx`;
    if (store.statusClasses[cls] !== undefined) store.statusClasses[cls] += 1;

    const key = routeKey(req);
    const r = store.routes.get(key) || { count: 0, totalMs: 0, maxMs: 0, errors: 0 };
    r.count += 1;
    r.totalMs += durMs;
    r.maxMs = Math.max(r.maxMs, durMs);
    if (res.statusCode >= 500) r.errors += 1;
    store.routes.set(key, r);
  });

  next();
}

function snapshot() {
  const routes = {};
  for (const [key, r] of store.routes.entries()) {
    routes[key] = {
      count: r.count,
      avgMs: Math.round((r.totalMs / r.count) * 100) / 100,
      maxMs: Math.round(r.maxMs * 100) / 100,
      errors: r.errors,
    };
  }
  return {
    uptimeSeconds: Math.round((Date.now() - store.startedAt) / 1000),
    totalRequests: store.total,
    inFlight: store.inFlight,
    statusClasses: { ...store.statusClasses },
    routes,
  };
}

function toPrometheus() {
  const s = snapshot();
  const lines = [];
  lines.push('# TYPE mindcare_requests_total counter');
  lines.push(`mindcare_requests_total ${s.totalRequests}`);
  lines.push('# TYPE mindcare_in_flight gauge');
  lines.push(`mindcare_in_flight ${s.inFlight}`);
  for (const [cls, n] of Object.entries(s.statusClasses)) {
    lines.push(`mindcare_responses_total{class="${cls}"} ${n}`);
  }
  for (const [key, r] of Object.entries(s.routes)) {
    const [method, path] = key.split(' ');
    const labels = `method="${method}",route="${path}"`;
    lines.push(`mindcare_route_requests_total{${labels}} ${r.count}`);
    lines.push(`mindcare_route_latency_avg_ms{${labels}} ${r.avgMs}`);
    lines.push(`mindcare_route_errors_total{${labels}} ${r.errors}`);
  }
  return lines.join('\n') + '\n';
}

function reset() {
  store.startedAt = Date.now();
  store.total = 0;
  store.inFlight = 0;
  store.statusClasses = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
  store.routes = new Map();
}

module.exports = { metricsMiddleware, snapshot, toPrometheus, reset };
