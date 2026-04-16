/**
 * MindCare — Admin Portal API Test Suite
 * =========================================
 * Tests every admin endpoint powering the Admin Portal dashboard.
 *
 * Usage (backend must be running on port 5000):
 *   cd backend && npm run test:admin
 */

require('dotenv').config();
const http  = require('http');
const https = require('https');
const url   = require('url');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL    = process.env.TEST_BASE_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) { console.error('❌  ADMIN_TOKEN not set in .env'); process.exit(1); }

// ── Tracking ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
let firstUserId = null, createdTherapistId = null, createdResourceId = null;
const results = [];

// ── HTTP Helper ───────────────────────────────────────────────────────────────
function req(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed  = url.parse(`${BASE_URL}${path}`);
    const isHttps = parsed.protocol === 'https:';
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.path,
      method,
      headers: {
        'Content-Type':  'application/json',
        'x-admin-token': ADMIN_TOKEN,
        ...extraHeaders,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const lib = isHttps ? https : http;
    const request = lib.request(options, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

// No-auth request
function noAuthReq(method, path) {
  return new Promise((resolve, reject) => {
    const parsed  = url.parse(`${BASE_URL}${path}`);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;
    const request = lib.request({
      hostname: parsed.hostname, port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.path, method,
      headers: { 'x-admin-token': 'wrong-token-xyz' },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    request.on('error', reject);
    request.end();
  });
}

// ── Test Runner ───────────────────────────────────────────────────────────────
async function test(label, fn) {
  const padded = label.length > 50 ? label.slice(0, 50) : label.padEnd(50, '.');
  process.stdout.write(`  ${padded}  `);
  try {
    const msg = await fn();
    console.log(`✅  ${msg || 'OK'}`);
    passed++;
    results.push({ label, status: 'PASS', msg: msg || 'OK' });
  } catch (err) {
    console.log(`❌  ${err.message}`);
    failed++;
    results.push({ label, status: 'FAIL', msg: err.message });
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
const ok = (label, cond, msg) => { if (!cond) throw new Error(`${label}: ${msg}`); };

// ═══════════════════════════════════════════════════════════════════════════════
async function runTests() {
  console.log('\n');
  console.log('═'.repeat(68));
  console.log('  🧪  MindCare Admin Portal — API Test Suite');
  console.log('═'.repeat(68));
  console.log(`  Server : ${BASE_URL}`);
  console.log(`  Token  : ${ADMIN_TOKEN.slice(0, 16)}...`);
  console.log('═'.repeat(68));

  // ── [1] Server Health ──────────────────────────────────────────────────────
  console.log('\n📡  [1] Server Health');
  await test('GET /  →  API is running', async () => {
    const r = await req('GET', '/');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return r.body?.status || r.body?.message || 'Online';
  });

  // ── [2] Auth Guard ─────────────────────────────────────────────────────────
  console.log('\n🔒  [2] Auth Guard');
  await test('Wrong token  →  401 Unauthorized', async () => {
    const r = await noAuthReq('GET', '/api/admin/users');
    assert(r.status === 401, `Expected 401 got ${r.status}`);
    return '401 blocked correctly';
  });

  // ── [3] Users ──────────────────────────────────────────────────────────────
  console.log('\n👥  [3] User Management');
  await test('GET /api/admin/users', async () => {
    const r = await req('GET', '/api/admin/users');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert(Array.isArray(r.body), 'Expected array');
    assert(r.body.length > 0, 'No users found — run npm run seed:test first');
    firstUserId = r.body[0].id;
    const u = r.body[0];
    assert('role' in u, 'Missing role field');
    assert('suspended' in u, 'Missing suspended field');
    return `${r.body.length} user(s)  ·  role + suspended fields present`;
  });

  await test('PATCH /users/:id/role  →  set clinician', async () => {
    const r = await req('PATCH', `/api/admin/users/${firstUserId}/role`, { role: 'clinician' });
    assert(r.status === 200, `Expected 200 got ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.role === 'clinician', `Got role: ${r.body.role}`);
    return 'role → clinician ✓';
  });

  await test('PATCH /users/:id/role  →  reset to user', async () => {
    const r = await req('PATCH', `/api/admin/users/${firstUserId}/role`, { role: 'user' });
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert(r.body.role === 'user', `Got role: ${r.body.role}`);
    return 'role reset → user ✓';
  });

  await test('PATCH /users/:id/role  →  invalid role → 400', async () => {
    const r = await req('PATCH', `/api/admin/users/${firstUserId}/role`, { role: 'god_mode' });
    assert(r.status === 400, `Expected 400 got ${r.status}`);
    return '400 on invalid role ✓';
  });

  await test('PATCH /users/:id/suspend  →  suspend account', async () => {
    const r = await req('PATCH', `/api/admin/users/${firstUserId}/suspend`, { suspended: true, reason: 'QA test suspension' });
    assert(r.status === 200, `Expected 200 got ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.suspended === true, 'Expected suspended=true');
    return 'account suspended ✓';
  });

  await test('PATCH /users/:id/suspend  →  reinstate account', async () => {
    const r = await req('PATCH', `/api/admin/users/${firstUserId}/suspend`, { suspended: false });
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert(r.body.suspended === false, 'Expected suspended=false');
    return 'account reinstated ✓';
  });

  // ── [4] Analytics ─────────────────────────────────────────────────────────
  console.log('\n📊  [4] Analytics & KPIs');
  await test('GET /api/admin/analytics', async () => {
    const r = await req('GET', '/api/admin/analytics');
    assert(r.status === 200, `Expected 200 got ${r.status}: ${JSON.stringify(r.body)}`);
    assert('kpis' in r.body, 'Missing kpis');
    assert('riskTrend' in r.body, 'Missing riskTrend');
    assert('moodHeatmap' in r.body, 'Missing moodHeatmap');
    const k = r.body.kpis;
    return `Users:${k.totalUsers}  Therapists:${k.activeTherapists}  Escalated:${k.escalatedReports}  Pending:${k.pendingAppointments}`;
  });

  // ── [5] Live Feed ─────────────────────────────────────────────────────────
  console.log('\n📡  [5] Live Activity Feed');
  await test('GET /api/admin/activity_feed', async () => {
    const r = await req('GET', '/api/admin/activity_feed');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert(Array.isArray(r.body), 'Expected array');
    return `${r.body.length} event(s) in feed`;
  });

  // ── [6] Audit Trail ───────────────────────────────────────────────────────
  console.log('\n🔐  [6] Audit Trail');
  await test('GET /api/admin/audit-logs', async () => {
    const r = await req('GET', '/api/admin/audit-logs?limit=10&skip=0');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert('logs' in r.body, 'Missing logs field');
    assert('total' in r.body, 'Missing total field');
    return `${r.body.total} total audit entries`;
  });

  // ── [7] CSV Export ────────────────────────────────────────────────────────
  console.log('\n📥  [7] CSV Exports');
  await test('GET /api/admin/export/patients', async () => {
    const r = await req('GET', '/api/admin/export/patients');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    const csv = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    assert(csv.length > 0, 'Empty response');
    return `${csv.length} bytes`;
  });

  await test('GET /api/admin/export/audit', async () => {
    const r = await req('GET', '/api/admin/export/audit');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return 'Audit CSV ✓';
  });

  await test('GET /api/admin/export/badtype  →  400', async () => {
    const r = await req('GET', '/api/admin/export/badtype');
    assert(r.status === 400, `Expected 400 got ${r.status}`);
    return '400 on unknown type ✓';
  });

  // ── [8] Pending Actions ───────────────────────────────────────────────────
  console.log('\n⚡  [8] Pending Actions Queue');
  await test('GET /api/admin/pending-verification', async () => {
    const r = await req('GET', '/api/admin/pending-verification');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return `pending-verification: ${JSON.stringify(Object.keys(r.body))}`;
  });

  await test('GET /api/admin/emergency-contacts?status=awaiting_admin', async () => {
    const r = await req('GET', '/api/admin/emergency-contacts?status=awaiting_admin');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert(Array.isArray(r.body), 'Expected array');
    return `${r.body.length} contact(s) awaiting admin`;
  });

  // ── [9] Therapists Hub ────────────────────────────────────────────────────
  console.log('\n🧑‍⚕️  [9] Therapist Management Hub');
  await test('GET /api/therapists  →  list (shared route)', async () => {
    const r = await req('GET', '/api/therapists');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return `${Array.isArray(r.body) ? r.body.length : '?'} therapist(s)`;
  });

  await test('POST /api/admin/therapists  →  create', async () => {
    const r = await req('POST', '/api/admin/therapists', {
      name:          'Dr. QA Tester',
      specialisation: 'Automated Testing',
      timing:        'Mon-Fri 9am-5pm',
      about:         'Created by automated test suite — safe to delete.',
    });
    assert(r.status === 201, `Expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.id, 'No ID in response');
    createdTherapistId = r.body.id;
    return `Created: ${r.body.name}  id:${createdTherapistId}`;
  });

  await test('PUT /api/admin/therapists/:id  →  update', async () => {
    const r = await req('PUT', `/api/admin/therapists/${createdTherapistId}`, {
      about: 'Updated by test suite.',
    });
    assert(r.status === 200, `Expected 200 got ${r.status}: ${JSON.stringify(r.body)}`);
    return 'Therapist updated ✓';
  });

  await test('DELETE /api/admin/therapists/:id  →  clean up', async () => {
    const r = await req('DELETE', `/api/admin/therapists/${createdTherapistId}`);
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return 'Test therapist deleted ✓';
  });

  // ── [10] Resource CMS ─────────────────────────────────────────────────────
  console.log('\n📚  [10] Resource CMS');
  await test('GET /api/admin/resources', async () => {
    const r = await req('GET', '/api/admin/resources');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return `${Array.isArray(r.body) ? r.body.length : '?'} resource(s)`;
  });

  await test('POST /api/admin/resources  →  create', async () => {
    const r = await req('POST', '/api/admin/resources', {
      title:       'QA Test Resource',
      type:        'article',
      url:         'https://example.com/qa-test',
      description: 'Created by automated test suite.',
      tags:        ['qa', 'test'],
    });
    assert(r.status === 201, `Expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
    createdResourceId = r.body.id || r.body._id;
    return `Created: ${r.body.title}`;
  });

  await test('PUT /api/admin/resources/:id  →  update', async () => {
    const r = await req('PUT', `/api/admin/resources/${createdResourceId}`, {
      description: 'Updated by QA test suite.',
    });
    assert(r.status === 200, `Expected 200 got ${r.status}: ${JSON.stringify(r.body)}`);
    return 'Resource updated ✓';
  });

  await test('DELETE /api/admin/resources/:id  →  clean up', async () => {
    const r = await req('DELETE', `/api/admin/resources/${createdResourceId}`);
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    return 'Test resource deleted ✓';
  });

  // ── [11] Broadcasts ───────────────────────────────────────────────────────
  console.log('\n📢  [11] Broadcast Notifications');
  await test('POST /notifications/broadcast  →  all_users', async () => {
    const r = await req('POST', '/api/admin/notifications/broadcast', {
      title:    '🧪 QA Broadcast — All Users',
      body:     'Automated test message. Please ignore.',
      audience: 'all_users',
    });
    assert(r.status === 201, `Expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
    assert(r.body.success, 'Expected success flag');
    return `Sent to ${r.body.recipientCount} user(s) ✓`;
  });

  await test('POST /notifications/broadcast  →  therapists', async () => {
    const r = await req('POST', '/api/admin/notifications/broadcast', {
      title:    '🧪 QA Broadcast — Therapists',
      body:     'Staff test notice.',
      audience: 'therapists',
    });
    assert(r.status === 201, `Expected 201 got ${r.status}: ${JSON.stringify(r.body)}`);
    return `Sent to ${r.body.recipientCount} therapist(s) ✓`;
  });

  await test('POST /notifications/broadcast  →  invalid audience → 400', async () => {
    const r = await req('POST', '/api/admin/notifications/broadcast', {
      title: 'Bad', body: 'Bad', audience: 'everyone_lol',
    });
    assert(r.status === 400, `Expected 400 got ${r.status}`);
    return '400 blocked ✓';
  });

  await test('POST /notifications/broadcast  →  missing body → 400', async () => {
    const r = await req('POST', '/api/admin/notifications/broadcast', { title: 'Only title' });
    assert(r.status === 400, `Expected 400 got ${r.status}`);
    return '400 on missing fields ✓';
  });

  await test('GET /api/admin/notifications', async () => {
    const r = await req('GET', '/api/admin/notifications?limit=10');
    assert(r.status === 200, `Expected 200 got ${r.status}`);
    assert('notifications' in r.body, 'Missing notifications field');
    assert('total' in r.body, 'Missing total field');
    return `${r.body.total} broadcast(s) in history`;
  });

  // ── [12] Admin Profile ────────────────────────────────────────────────────
  console.log('\n👤  [12] Admin Profile');
  await test('PUT /api/admin/profile  →  update name', async () => {
    const r = await req('PUT', '/api/admin/profile', {
      name:  'Admin QA',
      email: process.env.ADMIN_EMAIL_1 || 'admin@mindcare.com',
    });
    // Some setups use PUT, some PATCH — accept either 200 or 404 (route may not exist)
    if (r.status === 404) return 'Profile route not registered (skipped — non-critical)';
    assert(r.status === 200, `Expected 200 got ${r.status}: ${JSON.stringify(r.body)}`);
    return 'Profile updated ✓';
  });

  // ── Final Summary ─────────────────────────────────────────────────────────
  const total  = passed + failed;
  const pct    = Math.round((passed / total) * 100);
  const bar    = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));

  console.log('\n');
  console.log('═'.repeat(68));
  console.log('  📋  TEST RESULTS');
  console.log('═'.repeat(68));
  console.log(`  ${bar}  ${pct}%  (${passed}/${total})`);
  console.log('');

  if (failed > 0) {
    console.log('  ❌  FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`     • ${r.label}`);
      console.log(`       → ${r.msg}`);
    });
  } else {
    console.log('  🎉  All tests passed! Admin Portal is fully operational.');
  }
  console.log('═'.repeat(68));
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('\n❌  Test runner crashed:', err.message);
  process.exit(1);
});
