/**
 * MindCare — Patient Full Flow Test Script
 * ==========================================
 * Logs in as test@mindcare.com (patient) and exercises every major API endpoint.
 * Run: node scripts/testPatientFlow.js
 */

require('dotenv').config();
const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 5000}`;
let TOKEN = '';
let USER_ID = '';

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function request(method, path, body, auth = false) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (auth && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
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
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timed out (15s)'));
    });
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

// ─── Tests ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  MindCare  — Patient End-to-End Network Test');
  console.log(`  Target : ${BASE}`);
  console.log('══════════════════════════════════════════════════════\n');
  console.log('── SECTION 1: Auth & Identity ──────────────────────────\n');

  // 1. Health check
  try {
    const r = await request('GET', '/');
    record('Health check  GET /', r.status, 200, r.data?.status || '');
  } catch (e) {
    record('Health check  GET /', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // 2. Login as test patient (seeded account)
  try {
    const r = await request('POST', '/api/auth', { email: 'test@mindcare.com', password: 'Test@1234' });
    if (r.status === 200 && r.data.token) {
      TOKEN = r.data.token;
      USER_ID = r.data.user?._id;
      record('Login  POST /api/auth', r.status, 200, `role=${r.data.user?.role}  uid=${USER_ID}`);
    } else {
      record('Login  POST /api/auth', r.status, 200, JSON.stringify(r.data).slice(0, 120));
    }
  } catch (e) {
    record('Login  POST /api/auth', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  if (!TOKEN) {
    console.log('\n⚠️  No token — attempting fresh registration...\n');
    try {
      const r = await request('POST', '/api/user', {
        name: 'Test Patient',
        email: `testpatient_${Date.now()}@mindcare.com`,
        password: 'Test@1234',
        age: '25',
        gender: 'female',
      });
      if (r.status === 200 && r.data.token) {
        TOKEN = r.data.token;
        USER_ID = r.data.user?._id;
        record('Register new patient  POST /api/user', r.status, 200, `uid=${USER_ID}`);
      } else {
        record('Register new patient  POST /api/user', r.status, 200, JSON.stringify(r.data).slice(0, 120));
      }
    } catch (e) {
      record('Register new patient  POST /api/user', 0, 200, `NETWORK ERROR: ${e.message}`);
    }
  }

  // 3. Forgot Password flow
  try {
    const r = await request('POST', '/api/auth/forgot-password', { email: 'test@mindcare.com' });
    record('Forgot Password  POST /api/auth/forgot-password', r.status, 200, r.data?.message?.slice(0, 80) || '');
  } catch (e) {
    record('Forgot Password  POST /api/auth/forgot-password', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 2: Profile ──────────────────────────────────\n');

  // Profile — GET by userId
  try {
    const r = await request('GET', `/api/profile/${USER_ID}`, null, true);
    // Profile route only exposes POST sub-routes — check if this 404 is expected
    if (r.status === 200) {
      record('GET Profile  /api/profile/:uid', r.status, 200, `name=${r.data?.name}`);
    } else {
      record('GET Profile  /api/profile/:uid', r.status, 404, `(No GET by uid — uses POST /edit-profile)`);
    }
  } catch (e) {
    record('GET Profile  /api/profile/:uid', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Profile — edit
  try {
    const r = await request('POST', '/api/profile/edit-profile', { uid: USER_ID, name: 'Test User Updated' }, true);
    record('Edit Profile  POST /api/profile/edit-profile', r.status, 200, `name=${r.data?.name}`);
  } catch (e) {
    record('Edit Profile  POST /api/profile/edit-profile', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Profile — update concerns
  try {
    const r = await request('POST', '/api/profile/add-concerns', { uid: USER_ID, concerns: ['anxiety', 'sleep'] }, true);
    record('Update Concerns  POST /api/profile/add-concerns', r.status, 200, `concerns=${r.data?.concerns?.join(',')}`);
  } catch (e) {
    record('Update Concerns  POST /api/profile/add-concerns', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 3: Home & Quotes ────────────────────────────\n');

  // Home
  try {
    const r = await request('GET', '/api/home', null, true);
    record('GET Home Feed  /api/home', r.status, 200, `keys=${Object.keys(r.data || {}).join(',')}`);
  } catch (e) {
    record('GET Home Feed  /api/home', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Quotes (may fail if Redis is not connected — non-critical)
  try {
    const r = await request('GET', '/api/quotes', null, true);
    if (r.status === 200) {
      record('GET Quote of Day  /api/quotes', r.status, 200, `quote=${String(r.data?.quote || '?').slice(0,60)}`);
    } else {
      record('GET Quote of Day  /api/quotes', r.status, 200, `ERROR: ${JSON.stringify(r.data).slice(0,100)} (Redis likely not running)`);
    }
  } catch (e) {
    record('GET Quote of Day  /api/quotes', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 4: Mood Tracking ────────────────────────────\n');

  // Mood — log entry
  try {
    const r = await request('POST', '/api/mood', { rating: 7, note: 'Test mood entry from patient test' }, true);
    record('POST Mood Entry  /api/mood', r.status, 200, `id=${r.data?.id || '?'}`);
  } catch (e) {
    record('POST Mood Entry  /api/mood', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Mood — today check
  try {
    const r = await request('GET', '/api/mood/today', null, true);
    record('GET Mood Today  /api/mood/today', r.status, 200, `loggedToday=${r.data?.loggedToday}`);
  } catch (e) {
    record('GET Mood Today  /api/mood/today', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Mood — trend
  try {
    const r = await request('GET', '/api/mood/trend?window=7', null, true);
    record('GET Mood Trend  /api/mood/trend?window=7', r.status, 200, `days=${r.data?.days} entries=${r.data?.trend?.length}`);
  } catch (e) {
    record('GET Mood Trend  /api/mood/trend', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Mood — stats
  try {
    const r = await request('GET', '/api/mood/stats', null, true);
    record('GET Mood Stats  /api/mood/stats', r.status, 200, `avg=${r.data?.average} streak=${r.data?.streak}`);
  } catch (e) {
    record('GET Mood Stats  /api/mood/stats', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Gamification — streaks & badges
  try {
    const r = await request('GET', '/api/streaks/me', null, true);
    record('GET Streaks & Badges  /api/streaks/me', r.status, 200, `streak=${r.data?.currentStreak} badgesCount=${r.data?.badges?.length}`);
  } catch (e) {
    record('GET Streaks & Badges  /api/streaks/me', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  try {
    const r = await request('PATCH', '/api/streaks/seen', null, true);
    record('PATCH Mark Badges Seen  /api/streaks/seen', r.status, 200, `success=${r.data?.success}`);
  } catch (e) {
    record('PATCH Mark Badges Seen  /api/streaks/seen', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Input Validation — Mood Rating > 10 should fail (422)
  try {
    const r = await request('POST', '/api/mood', { rating: 15, note: 'Too high' }, true);
    record('POST Mood Invalid Rating (rating=15)  /api/mood', r.status, 422, r.data?.errors ? JSON.stringify(r.data.errors) : '');
  } catch (e) {
    record('POST Mood Invalid Rating (rating=15)  /api/mood', 0, 422, `NETWORK ERROR: ${e.message}`);
  }


  console.log('\n── SECTION 5: Journals ─────────────────────────────────\n');

  // Journals — list
  try {
    const r = await request('GET', '/api/journals', null, true);
    record('GET Journals  /api/journals', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Journals  /api/journals', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Journals — create
  try {
    const r = await request('POST', '/api/journals', { title: 'Test Journal', content: 'Test content', mood: 'calm', tags: ['test'] }, true);
    record('POST Journal  /api/journals', r.status, 200, `id=${r.data?._id || '?'}`);
  } catch (e) {
    record('POST Journal  /api/journals', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 6: Therapists & Appointments ────────────────\n');

  // Therapists
  try {
    const r = await request('GET', '/api/therapists', null, true);
    record('GET Therapists  /api/therapists', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Therapists  /api/therapists', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Appointments
  try {
    const r = await request('GET', '/api/appointments', null, true);
    record('GET Appointments  /api/appointments', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Appointments  /api/appointments', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 7: Wellness & Goals ──────────────────────────\n');

  // Wellness Plan
  try {
    const r = await request('GET', '/api/wellness', null, true);
    record('GET Wellness Plan  /api/wellness', r.status, 200, `status=${r.data?.status || JSON.stringify(r.data).slice(0,60)}`);
  } catch (e) {
    record('GET Wellness Plan  /api/wellness', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Goals
  try {
    const r = await request('GET', '/api/goals', null, true);
    record('GET Goals  /api/goals', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Goals  /api/goals', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 8: Emergency Contact ────────────────────────\n');

  try {
    const r = await request('GET', '/api/emergency-contact', null, true);
    record('GET Emergency Contact  /api/emergency-contact', r.status, 200, `name=${r.data?.name || JSON.stringify(r.data).slice(0,60)}`);
  } catch (e) {
    record('GET Emergency Contact  /api/emergency-contact', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 9: Issues / AI Assessments ─────────────────\n');

  // Issues categories (public)
  try {
    const r = await request('GET', '/api/issues/categories', null, false);
    record('GET Issue Categories  /api/issues/categories', r.status, 200, `count=${r.data?.categories?.length}`);
  } catch (e) {
    record('GET Issue Categories  /api/issues/categories', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Issues report
  try {
    const r = await request('POST', '/api/issues/report', {
      category: 'anxiety',
      severity: 3,
      description: 'Feeling a bit overwhelmed with exams',
      moodTag: 'anxious'
    }, true);
    record('POST Issue Report  /api/issues/report', r.status, 200, `risk=${r.data?.riskLevel}`);
  } catch (e) {
    record('POST Issue Report  /api/issues/report', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Burnout alert
  try {
    const r = await request('GET', '/api/issues/burnout-alert', null, true);
    record('GET Burnout Alert  /api/issues/burnout-alert', r.status, 200, `active=${r.data?.active}`);
  } catch (e) {
    record('GET Burnout Alert  /api/issues/burnout-alert', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 10: Content & Resources ────────────────────\n');

  // Content search (needs category param)
  try {
    const r = await request('GET', '/api/content/search?category=meditation', null, true);
    record('GET Content Search  /api/content/search?category=meditation', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Content Search  /api/content/search', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Assigned Resources
  try {
    const r = await request('GET', '/api/resources/assigned', null, true);
    record('GET Assigned Resources  /api/resources/assigned', r.status, 200, `count=${r.data?.resources?.length}`);
  } catch (e) {
    record('GET Assigned Resources  /api/resources/assigned', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 11: Fitness ──────────────────────────────────\n');

  // Fitness categories (correct endpoint)
  try {
    const r = await request('GET', '/api/fitness/categories', null, false);
    record('GET Fitness Categories  /api/fitness/categories', r.status, 200, `keys=${Object.keys(r.data || {}).join(',')}`);
  } catch (e) {
    record('GET Fitness Categories  /api/fitness/categories', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Fitness subcategory
  try {
    const r = await request('GET', '/api/fitness/Yoga', null, false);
    record('GET Fitness Subcategory  /api/fitness/Yoga', r.status, 200, `keys=${Object.keys(r.data || {}).join(',').slice(0,60)}`);
  } catch (e) {
    record('GET Fitness Subcategory  /api/fitness/Yoga', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 12: Blogs ────────────────────────────────────\n');

  try {
    const r = await request('GET', '/api/blogs', null, true);
    record('GET Blogs  /api/blogs', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Blogs  /api/blogs', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 13: Groups & Peers ───────────────────────────\n');

  // Groups — user endpoint (my-groups)
  try {
    const r = await request('GET', '/api/groups/my-groups', null, true);
    record('GET My Groups  /api/groups/my-groups', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET My Groups  /api/groups/my-groups', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Peers — suggestions
  try {
    const r = await request('GET', '/api/peers/suggestions', null, true);
    record('GET Peer Suggestions  /api/peers/suggestions', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Peer Suggestions  /api/peers/suggestions', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Peers — requests
  try {
    const r = await request('GET', '/api/peers/requests', null, true);
    record('GET Peer Requests  /api/peers/requests', r.status, 200, `incoming=${r.data?.incoming?.length} outgoing=${r.data?.outgoing?.length}`);
  } catch (e) {
    record('GET Peer Requests  /api/peers/requests', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  // Peers — list
  try {
    const r = await request('GET', '/api/peers/list', null, true);
    record('GET Peer List  /api/peers/list', r.status, 200, `count=${Array.isArray(r.data) ? r.data.length : '?'}`);
  } catch (e) {
    record('GET Peer List  /api/peers/list', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 14: Chat (Tink AI) ───────────────────────────\n');

  try {
    const r = await request('POST', '/api/chat', { message: 'Hi Tink, I am feeling a bit anxious today.' }, true);
    if (r.status === 200) {
      record('POST Chat Message  /api/chat', r.status, 200, `reply=${String(r.data?.reply || '').slice(0, 80)}`);
    } else {
      record('POST Chat Message  /api/chat', r.status, 200, JSON.stringify(r.data).slice(0, 100));
    }
  } catch (e) {
    record('POST Chat Message  /api/chat', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 15: Analytics & Fingerprint ─────────────────\n');

  // Analytics fingerprint
  try {
    const r = await request('GET', '/api/analytics/fingerprint', null, true);
    record('GET Emotional Fingerprint  /api/analytics/fingerprint', r.status, 200, `keys=${Object.keys(r.data || {}).join(',').slice(0,80)}`);
  } catch (e) {
    record('GET Emotional Fingerprint  /api/analytics/fingerprint', 0, 200, `NETWORK ERROR: ${e.message}`);
  }

  console.log('\n── SECTION 16: AI Intake Session ────────────────────────\n');

  // AI Intake — start session
  let sessionId = null;
  try {
    const r = await request('POST', '/api/aiIntake/session/start', {
      triggerType: 'login_quick',
      consent: { cameraConsent: true, micConsent: true, textConsent: true }
    }, true);
    if (r.status === 201) {
      sessionId = r.data?.sessionId;
      record('POST AI Intake Start  /api/aiIntake/session/start', r.status, 201, `sessionId=${sessionId}`);
    } else {
      record('POST AI Intake Start  /api/aiIntake/session/start', r.status, 201, JSON.stringify(r.data).slice(0, 120));
    }
  } catch (e) {
    record('POST AI Intake Start  /api/aiIntake/session/start', 0, 201, `NETWORK ERROR: ${e.message}`);
  }

  if (sessionId) {
    // Text response
    try {
      const r = await request('POST', `/api/aiIntake/session/${sessionId}/text-response`, {
        answers: [{ questionId: 'q1', text: 'I have been feeling anxious and stressed lately.' }]
      }, true);
      record('POST AI Intake Text  /session/:id/text-response', r.status, 200, `status=${r.data?.sessionStatus}`);
    } catch (e) {
      record('POST AI Intake Text  /session/:id/text-response', 0, 200, `NETWORK ERROR: ${e.message}`);
    }

    // Voice response
    try {
      const r = await request('POST', `/api/aiIntake/session/${sessionId}/voice-response`, {
        voiceRef: 'simulated_voice_ref'
      }, true);
      record('POST AI Intake Voice  /session/:id/voice-response', r.status, 200, `status=${r.data?.sessionStatus}`);
    } catch (e) {
      record('POST AI Intake Voice  /session/:id/voice-response', 0, 200, `NETWORK ERROR: ${e.message}`);
    }

    // Vision response
    try {
      const r = await request('POST', `/api/aiIntake/session/${sessionId}/vision-meta`, {
        visionRef: 'simulated_vision_ref'
      }, true);
      record('POST AI Intake Vision  /session/:id/vision-meta', r.status, 200, `status=${r.data?.sessionStatus}`);
    } catch (e) {
      record('POST AI Intake Vision  /session/:id/vision-meta', 0, 200, `NETWORK ERROR: ${e.message}`);
    }

    // Fusion run
    try {
      const r = await request('POST', `/api/aiIntake/session/${sessionId}/fusion/run`, {}, true);
      record('POST AI Fusion Run  /session/:id/fusion/run', r.status, 200, `risk=${r.data?.result?.riskLevel}`);
    } catch (e) {
      record('POST AI Fusion Run  /session/:id/fusion/run', 0, 200, `NETWORK ERROR: ${e.message}`);
    }

    // Session report
    try {
      const r = await request('GET', `/api/aiIntake/session/${sessionId}/report`, null, true);
      record('GET AI Session Report  /session/:id/report', r.status, 200, `status=${r.data?.session?.status}`);
    } catch (e) {
      record('GET AI Session Report  /session/:id/report', 0, 200, `NETWORK ERROR: ${e.message}`);
    }
  }

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  FINAL SUMMARY');
  console.log('══════════════════════════════════════════════════════');

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const total  = results.length;

  console.log(`\n  Total  : ${total}`);
  console.log(`  Passed : ${passed}`);
  console.log(`  Failed : ${failed}\n`);

  if (failed > 0) {
    console.log('── FAILURES ──────────────────────────────────────────');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  ❌  ${r.name}`);
      console.log(`      Got: ${r.status}  Expected: ${r.expected}`);
      if (r.detail) console.log(`      Detail: ${r.detail}`);
    });
    console.log('');
  }

  if (failed === 0) {
    console.log('  🎉  ALL TESTS PASSED — no network errors detected!\n');
  } else {
    console.log(`  📋  ${passed}/${total} endpoints healthy. See failures above.\n`);
  }
}

run().catch(err => {
  console.error('\n❌  Test runner crashed:', err.message);
  process.exit(1);
});
