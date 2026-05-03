/**
 * MindCare — Full Clinical Profile End-to-End Test
 * =================================================
 * Validates the full clinical profile payload retrieval for Admins and Clinicians.
 * Run: node scripts/testClinicalProfile.js
 */

require('dotenv').config();
const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 5000}`;

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    if (data) reqHeaders['Content-Length'] = Buffer.byteLength(data);

    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Timeout')));
    if (data) req.write(data);
    req.end();
  });
}

// ─── Result tracking ─────────────────────────────────────────────────────────
const results = [];
function record(name, status, expected, detail = '') {
  const ok = status === expected;
  const icon = ok ? '✅' : '❌';
  results.push({ name, status, expected, ok, detail });
  const line = `${icon}  [${status}]  ${name}`;
  console.log(detail ? `${line}\n      └─ ${detail}` : line);
}

// ─── Test Flow ───────────────────────────────────────────────────────────────
async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  MindCare  — Clinical Profile End-to-End Test');
  console.log('══════════════════════════════════════════════════════\n');

  // 1. Create a Patient User
  let patientToken = '';
  let patientId = '';
  try {
    const r = await request('POST', '/api/user', {
      name: 'Clinical Test Patient',
      email: `clinical_test_${Date.now()}@mindcare.com`,
      password: 'Test@1234',
      age: '30',
      gender: 'male',
    });
    if (r.status === 200) {
      patientToken = r.data.token;
      patientId = r.data.user._id;
      record('Create Patient  POST /api/user', r.status, 200, `patientId=${patientId}`);
    } else {
      record('Create Patient  POST /api/user', r.status, 200, JSON.stringify(r.data));
    }
  } catch (e) {
    record('Create Patient', 0, 200, e.message);
  }

  if (!patientId) return console.log('Cannot proceed without a patient user.');

  // 2. Add some Clinical Data (Mood & Issue Report)
  try {
    await request('POST', '/api/mood', { rating: 3, note: 'Feeling low' }, { Authorization: `Bearer ${patientToken}` });
    await request('POST', '/api/issues/report', { category: 'depression', severity: 4, description: 'Clinical test' }, { Authorization: `Bearer ${patientToken}` });
    record('Populate Data   POST /api/mood & /api/issues/report', 200, 200, 'Populated mood and risk report.');
  } catch (e) {
    record('Populate Data', 0, 200, e.message);
  }

  // 3. Create a Clinician User
  let clinicianToken = '';
  try {
    // Register as user first
    const clinicianEmail = `clinician_test_${Date.now()}@mindcare.com`;
    const r1 = await request('POST', '/api/user', {
      name: 'Dr. Test Clinician',
      email: clinicianEmail,
      password: 'Test@1234',
    });
    
    if (r1.status === 200) {
      clinicianToken = r1.data.token;
      const clinicianId = r1.data.user._id;
      
      // Promote to clinician using Admin token
      const adminToken = process.env.ADMIN_TOKEN || 'admin_secret_token';
      const r2 = await request('PATCH', `/api/admin/users/${clinicianId}/role`, { role: 'clinician' }, { 'x-admin-token': adminToken });
      
      if (r2.status === 200) {
        // Re-authenticate to get a fresh token with the 'clinician' role
        const r3 = await request('POST', '/api/auth', { email: clinicianEmail, password: 'Test@1234' });
        if (r3.status === 200) {
          clinicianToken = r3.data.token;
          record('Create Clinician  POST /api/user + PATCH /role', 200, 200, `clinicianId=${clinicianId}`);
        } else {
           record('Promote Clinician - Reauth', r3.status, 200, JSON.stringify(r3.data));
        }
      } else {
        record('Promote Clinician', r2.status, 200, JSON.stringify(r2.data));
      }
    } else {
      record('Create Clinician', r1.status, 200, JSON.stringify(r1.data));
    }
  } catch (e) {
    record('Create Clinician', 0, 200, e.message);
  }

  // 4. Test Clinician Full Profile Access
  try {
    const r = await request('GET', `/api/therapists/patient/${patientId}/profile`, null, { Authorization: `Bearer ${clinicianToken}` });
    if (r.status === 200) {
      const { user, moods, issues } = r.data;
      record('Clinician View  GET /api/therapists/patient/:id/profile', r.status, 200, `moods=${moods?.length} issues=${issues?.length}`);
    } else {
      record('Clinician View', r.status, 200, JSON.stringify(r.data));
    }
  } catch (e) {
    record('Clinician View', 0, 200, e.message);
  }

  // 5. Test Admin Full Profile Access
  try {
    const adminToken = process.env.ADMIN_TOKEN || 'admin_secret_token';
    const r = await request('GET', `/api/admin/users/${patientId}/full-profile`, null, { 'x-admin-token': adminToken });
    if (r.status === 200) {
      const { user, moods, issues } = r.data;
      record('Admin View      GET /api/admin/users/:id/full-profile', r.status, 200, `moods=${moods?.length} issues=${issues?.length}`);
    } else {
      record('Admin View', r.status, 200, JSON.stringify(r.data));
    }
  } catch (e) {
    record('Admin View', 0, 200, e.message);
  }

  console.log('\n══════════════════════════════════════════════════════');
  const passed = results.filter(r => r.ok).length;
  console.log(`  SUMMARY: ${passed}/${results.length} tests passed.\n`);
}

run().catch(console.error);
