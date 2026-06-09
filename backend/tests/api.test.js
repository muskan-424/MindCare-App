const request = require('supertest');
const mongoose = require('mongoose');
const { startMemoryDb, clearDb, stopMemoryDb } = require('./helpers/testDb');

let app;

beforeAll(async () => {
  app = await startMemoryDb();
});

afterAll(async () => {
  await stopMemoryDb();
});

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

    const AuditLog = mongoose.model('AuditLog');
    const logged = await AuditLog.findOne({ action: 'auth.login' });
    expect(logged).not.toBeNull();
  });

  test('rejects wrong password and records a failed-login audit event', async () => {
    const { body } = await registerUser();
    const res = await request(app).post('/api/auth').send({ email: body.email, password: 'wrongpass' });
    expect(res.status).toBe(400);

    const AuditLog = mongoose.model('AuditLog');
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

    const AuditLog = mongoose.model('AuditLog');
    const crisis = await AuditLog.findOne({ action: 'chat.crisis' });
    expect(crisis).not.toBeNull();
  });

  test('asks an anonymous user to log in for personal lookups', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'show my mood this week' });
    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('lookup_mood');
    expect(res.body.reply).toMatch(/log/i);
  });
});
