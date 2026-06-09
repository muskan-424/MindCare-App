const request = require('supertest');
const { startMemoryDb, clearDb, stopMemoryDb } = require('./helpers/testDb');
const { shapeGoal, stripInternal } = require('../src/shared/responseShapers');

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

async function registerUser() {
  const body = {
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: 'secret123',
  };
  const res = await request(app).post('/api/user').send(body);
  return { res, body };
}

describe('OpenAPI docs', () => {
  test('serves the OpenAPI JSON spec', async () => {
    const res = await request(app).get('/api/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths['/chat']).toBeDefined();
    expect(res.body.paths['/goals']).toBeDefined();
  });

  test('serves Swagger UI HTML', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger/i);
  });
});

describe('Response shapers', () => {
  test('stripInternal removes password and __v', () => {
    const out = stripInternal({ _id: 'abc', name: 'A', password: 'hash', __v: 2 });
    expect(out.password).toBeUndefined();
    expect(out.__v).toBeUndefined();
    expect(out.name).toBe('A');
  });

  test('shapeGoal exposes id and omits __v', () => {
    const shaped = shapeGoal({ _id: '507f1f77bcf86cd799439011', title: 'Run', __v: 0, progress: 0 });
    expect(shaped.id).toBe('507f1f77bcf86cd799439011');
    expect(shaped.__v).toBeUndefined();
    expect(shaped.title).toBe('Run');
  });
});

describe('AI maturity (capabilities + confidence)', () => {
  test('capabilities reports model tiering and confidence gate', async () => {
    const res = await request(app).get('/api/chat/capabilities');
    expect(res.status).toBe(200);
    expect(res.body.fastModel).toBeDefined();
    expect(res.body.qualityModel).toBeDefined();
    expect(typeof res.body.confidenceGate).toBe('number');
    expect(res.body.ragMode).toBe('local');
  });

  test('shouldGateConfidence respects CHAT_CONFIDENCE_GATE', () => {
    jest.isolateModules(() => {
      process.env.CHAT_CONFIDENCE_GATE = '0.99';
      jest.resetModules();
      const { shouldGateConfidence } = require('../src/domains/community/services/tinkChatService');
      expect(shouldGateConfidence(0.5)).toBe(true);
      expect(shouldGateConfidence(0.99)).toBe(false);
    });
  });
});

describe('Auth DTO layer', () => {
  test('login response omits password and __v', async () => {
    const { body } = await registerUser();
    const login = await request(app).post('/api/auth').send({ email: body.email, password: 'secret123' });
    expect(login.status).toBe(200);
    expect(login.body.user.password).toBeUndefined();
    expect(login.body.user.__v).toBeUndefined();
    expect(login.body.user.id).toBeDefined();
    expect(login.body.profile.__v).toBeUndefined();
  });
});

describe('Goals DTO layer', () => {
  test('goal responses omit __v', async () => {
    const { res: reg } = await registerUser();
    const token = reg.body.token;
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app).post('/api/goals').set(auth).send({ title: 'Walk daily' });
    expect(created.status).toBe(201);
    expect(created.body.__v).toBeUndefined();
    expect(created.body.id).toBeDefined();

    const list = await request(app).get('/api/goals').set(auth);
    expect(list.body[0].__v).toBeUndefined();
  });
});

describe('Hybrid RAG (local fallback)', () => {
  test('help queries still return local RAG sources without Pinecone', async () => {
    const rag = require('../src/domains/community/services/tinkRagService');
    const hits = await rag.retrieve('how does privacy work', 2);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].source).toBe('local');
  });
});
