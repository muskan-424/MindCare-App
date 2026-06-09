const http = require('http');
const request = require('supertest');
const WebSocket = require('ws');
const { startMemoryDb, clearDb, stopMemoryDb } = require('./helpers/testDb');

let app;
let httpServer;
let wss;
let wsPort;
let attachChatWebSocket;
let processAgenticChat;

async function closeHttpStack() {
  if (wss) {
    await new Promise((resolve) => {
      wss.clients.forEach((client) => {
        try { client.terminate(); } catch (_) { /* ignore */ }
      });
      wss.close(() => resolve());
    });
    wss = null;
  }
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
    httpServer = null;
  }
}

function connectChatWs(token) {
  const q = token ? `?token=${encodeURIComponent(token)}` : '';
  const url = `ws://127.0.0.1:${wsPort}/api/chat/ws${q}`;
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const inbox = [];

    ws.on('message', (raw) => {
      inbox.push(JSON.parse(String(raw)));
    });
    ws.on('open', () => resolve({ ws, inbox }));
    ws.on('error', reject);
  });
}

function waitForWsMessage(ws, inbox, type, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const hit = inbox.find(m => m.type === type);
      if (hit) {
        const idx = inbox.indexOf(hit);
        inbox.splice(idx, 1);
        resolve(hit);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for ${type}`));
        return;
      }
      setTimeout(tick, 25);
    };
    tick();
  });
}

beforeAll(async () => {
  app = await startMemoryDb();
  ({ attachChatWebSocket } = require('../src/domains/community/ws/chatWs'));
  ({ processAgenticChat } = require('../src/domains/community/services/chatAgentService'));
  httpServer = http.createServer(app);
  wss = attachChatWebSocket(httpServer);
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  wsPort = httpServer.address().port;
});

afterAll(async () => {
  await closeHttpStack();
  await stopMemoryDb();
}, 15000);

afterEach(async () => {
  await clearDb();
});

// Helper: register a user and return { token, userId }.
async function registerUser(overrides = {}) {
  const body = {
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: 'secret123',
    ...overrides,
  };
  const res = await request(app).post('/api/user').send(body);
  return { res, body };
}

describe('Health & 404', () => {
  test('GET / returns API status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toMatch(/MindCare API/i);
  });

  test('unknown route returns standardized 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('Observability', () => {
  test('liveness returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('readiness reports the database as up', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.checks.database).toBe('up');
  });

  test('metrics endpoint returns request counters', async () => {
    await request(app).get('/api/health'); // generate some traffic
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalRequests).toBe('number');
    expect(res.body.routes).toBeDefined();
  });

  test('metrics endpoint can render Prometheus text', async () => {
    const res = await request(app).get('/api/metrics?format=prometheus');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/mindcare_requests_total/);
  });
});

describe('Auth flow', () => {
  test('registers a new user and returns a token', async () => {
    const { res } = await registerUser();
    expect([200, 201]).toContain(res.status);
    expect(res.body.token).toBeTruthy();
  });

  test('rejects duplicate registration', async () => {
    const { body } = await registerUser();
    const dup = await request(app).post('/api/user').send(body);
    expect(dup.status).toBe(400);
  });

  test('rejects invalid email on register (validation)', async () => {
    const res = await request(app).post('/api/user').send({ name: 'X', email: 'not-an-email', password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('logs in with correct credentials and records an audit event', async () => {
    const { body } = await registerUser();
    const res = await request(app).post('/api/auth').send({ email: body.email, password: body.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    const AuditLog = require('mongoose').model('AuditLog');
    const logged = await AuditLog.findOne({ action: 'auth.login' });
    expect(logged).not.toBeNull();
  });

  test('rejects wrong password and records a failed-login audit event', async () => {
    const { body } = await registerUser();
    const res = await request(app).post('/api/auth').send({ email: body.email, password: 'wrongpass' });
    expect(res.status).toBe(400);

    const AuditLog = require('mongoose').model('AuditLog');
    const failed = await AuditLog.findOne({ action: 'auth.login_failed' });
    expect(failed).not.toBeNull();
  });
});

describe('Goals CRUD (auth + validation)', () => {
  test('requires authentication', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });

  test('rejects goal creation without a title (shared validate middleware)', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.token;
    const res = await request(app).post('/api/goals').set('Authorization', `Bearer ${token}`).send({ description: 'no title' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  test('creates, lists, updates progress, and deletes a goal', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.token;
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app).post('/api/goals').set(auth).send({ title: 'Meditate daily', category: 'mental_health' });
    expect(created.status).toBe(201);
    const goalId = created.body._id;

    const list = await request(app).get('/api/goals').set(auth);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const progress = await request(app).patch(`/api/goals/${goalId}/progress`).set(auth).send({ progress: 100 });
    expect(progress.status).toBe(200);
    expect(progress.body.status).toBe('completed');

    const del = await request(app).delete(`/api/goals/${goalId}`).set(auth);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });

  test('rejects out-of-range progress', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.token;
    const auth = { Authorization: `Bearer ${token}` };
    const created = await request(app).post('/api/goals').set(auth).send({ title: 'Sleep 8h' });
    const bad = await request(app).patch(`/api/goals/${created.body._id}/progress`).set(auth).send({ progress: 500 });
    expect(bad.status).toBe(400);
  });
});

describe('Agentic chat (offline / rule-based)', () => {
  test('responds to a general message', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'I feel a bit low today' });
    expect(res.status).toBe(200);
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
    expect(res.body.mode).toBe('rule');
  });

  test('classifies an app-help question and returns RAG sources', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'How does the assessment work?' });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('help');
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBeGreaterThan(0);
  });

  test('flags a crisis message and records an audit event', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'I want to kill myself' });
    expect(res.status).toBe(200);
    expect(res.body.crisis).toBe(true);

    const AuditLog = require('mongoose').model('AuditLog');
    const crisis = await AuditLog.findOne({ action: 'chat.crisis' });
    expect(crisis).not.toBeNull();
  });

  test('asks an anonymous user to log in for personal lookups', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'show my mood this week' });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('lookup_mood');
    expect(res.body.reply).toMatch(/log/i);
  });

  test('processAgenticChat rejects an empty message', async () => {
    await expect(processAgenticChat({ message: '   ' })).rejects.toMatchObject({ status: 400 });
  });
});

const ADMIN_HEADERS = { 'x-admin-token': 'test_admin_token' };

describe('Admin API (token + DTO)', () => {
  test('rejects requests without admin token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  test('lists users with shaped payloads (no password / __v)', async () => {
    await registerUser();
    const res = await request(app).get('/api/admin/users').set(ADMIN_HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].password).toBeUndefined();
    expect(res.body[0].__v).toBeUndefined();
    expect(typeof res.body[0].id).toBe('string');
  });

  test('lists resources with string ids', async () => {
    const res = await request(app).get('/api/admin/resources').set(ADMIN_HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Public content (DTO)', () => {
  test('GET /api/home returns shaped tiles and categories', async () => {
    const res = await request(app).get('/api/home');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.selfHelpTiles)).toBe(true);
    expect(Array.isArray(res.body.contentCategories)).toBe(true);
    if (res.body.selfHelpTiles.length) {
      expect(res.body.selfHelpTiles[0].__v).toBeUndefined();
      expect(res.body.selfHelpTiles[0].id).toBeTruthy();
    }
  });

  test('GET /api/quotes returns quote and author', async () => {
    const res = await request(app).get('/api/quotes');
    expect(res.status).toBe(200);
    expect(typeof res.body.quote).toBe('string');
    expect(typeof res.body.author).toBe('string');
    expect(res.body.__v).toBeUndefined();
  });

  test('GET /api/blogs returns featured and popular feeds', async () => {
    const res = await request(app).get('/api/blogs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.featured)).toBe(true);
    expect(Array.isArray(res.body.popular)).toBe(true);
    if (res.body.featured.length) {
      expect(typeof res.body.featured[0].id).toBe('string');
      expect(res.body.featured[0].__v).toBeUndefined();
    }
  });
});

describe('Appointments (auth + DTO)', () => {
  test('submits and lists a consultation request', async () => {
    const { res: reg } = await registerUser();
    const auth = { Authorization: `Bearer ${reg.body.token}` };

    const created = await request(app).post('/api/appointments').set(auth).send({
      requestedSpeciality: 'Psychologist',
      preferredDates: ['2026-06-15'],
      preferredTime: 'morning',
      userNote: 'Need support',
    });
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTruthy();
    expect(created.body.__v).toBeUndefined();
    expect(created.body.status).toBe('awaiting_admin');

    const list = await request(app).get('/api/appointments').set(auth);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(created.body.id);
    expect(list.body[0].__v).toBeUndefined();
  });
});

describe('Wellness plans (auth + DTO)', () => {
  test('returns exists:false when the user has no plan', async () => {
    const { res: reg } = await registerUser();
    const auth = { Authorization: `Bearer ${reg.body.token}` };
    const res = await request(app).get('/api/wellness').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
  });

  test('submits a wellness request and retrieves a shaped plan', async () => {
    const { res: reg } = await registerUser();
    const auth = { Authorization: `Bearer ${reg.body.token}` };

    const created = await request(app).post('/api/wellness/request').set(auth).send({
      goals: ['Reduce Anxiety'],
      currentStruggles: 'Work stress',
      preferredPace: 'Moderate',
    });
    expect(created.status).toBe(201);
    expect(created.body.plan.id).toBeTruthy();
    expect(created.body.plan.__v).toBeUndefined();
    expect(created.body.plan.status).toBe('awaiting_admin');

    const get = await request(app).get('/api/wellness').set(auth);
    expect(get.status).toBe(200);
    expect(get.body.exists).toBe(true);
    expect(get.body.goals).toContain('Reduce Anxiety');
    expect(get.body.__v).toBeUndefined();
  });
});

describe('WebSocket chat', () => {
  test('sends ready on connect (anonymous)', async () => {
    const { ws, inbox } = await connectChatWs();
    const ready = await waitForWsMessage(ws, inbox, 'ready');
    expect(ready.authenticated).toBe(false);
    ws.close();
  });

  test('returns a reply for a chat message', async () => {
    const { ws, inbox } = await connectChatWs();
    await waitForWsMessage(ws, inbox, 'ready');
    const replyPromise = waitForWsMessage(ws, inbox, 'reply');
    ws.send(JSON.stringify({ type: 'chat', message: 'How are you?' }));
    const reply = await replyPromise;
    expect(typeof reply.reply).toBe('string');
    expect(reply.reply.length).toBeGreaterThan(0);
    ws.close();
  });

  test('returns error for invalid JSON', async () => {
    const { ws, inbox } = await connectChatWs();
    await waitForWsMessage(ws, inbox, 'ready');
    const errPromise = waitForWsMessage(ws, inbox, 'error');
    ws.send('not-json');
    const err = await errPromise;
    expect(err.message).toMatch(/invalid json/i);
    ws.close();
  });

  test('authenticates when a valid token is supplied', async () => {
    const { res: reg } = await registerUser();
    const { ws, inbox } = await connectChatWs(reg.body.token);
    const ready = await waitForWsMessage(ws, inbox, 'ready');
    expect(ready.authenticated).toBe(true);
    ws.close();
  });
});
