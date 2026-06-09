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
    expect(res.body.websocket).toBe(true);
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

describe('Mood DTO layer', () => {
  test('mood log response uses string id and omits __v', async () => {
    const { res: reg } = await registerUser();
    const auth = { Authorization: `Bearer ${reg.body.token}` };
    const created = await request(app).post('/api/mood').set(auth).send({ rating: 7, note: 'ok day' });
    expect(created.status).toBe(200);
    expect(typeof created.body.id).toBe('string');
    expect(created.body.__v).toBeUndefined();
    expect(created.body.rating).toBe(7);
    expect(typeof created.body.streak).toBe('number');
  });
});

describe('Journal DTO layer', () => {
  test('journal list and create responses omit __v', async () => {
    const { res: reg } = await registerUser();
    const auth = { Authorization: `Bearer ${reg.body.token}` };
    const created = await request(app).post('/api/journals').set(auth).send({ content: 'Today was reflective.' });
    expect(created.status).toBe(200);
    expect(created.body.__v).toBeUndefined();
    expect(typeof created.body.id).toBe('string');
    expect(created.body.content).toBe('Today was reflective.');

    const list = await request(app).get('/api/journals').set(auth);
    expect(list.status).toBe(200);
    expect(list.body[0].__v).toBeUndefined();
    expect(list.body[0].date).toBeDefined();
  });
});

describe('Appointment DTO layer', () => {
  test('shapeAppointmentPatientView omits __v and maps therapist fields', () => {
    const { shapeAppointmentPatientView } = require('../src/shared/responseShapers');
    const shaped = shapeAppointmentPatientView({
      _id: '507f1f77bcf86cd799439011',
      __v: 0,
      requestedSpeciality: 'Psychologist',
      preferredDates: ['2026-06-10'],
      preferredTime: 'morning',
      userNote: 'Need help',
      status: 'awaiting_admin',
      therapist: { _id: '507f1f77bcf86cd799439012', name: 'Dr. A', img: 'x.png', specialisation: 'Psychologist' },
      createdAt: new Date('2026-06-01'),
    });
    expect(shaped.__v).toBeUndefined();
    expect(shaped.id).toBe('507f1f77bcf86cd799439011');
    expect(shaped.therapistName).toBe('Dr. A');
    expect(shaped.therapistId).toBe('507f1f77bcf86cd799439012');
  });

  test('shapeAppointmentTherapistView preserves _id for therapist UI', () => {
    const { shapeAppointmentTherapistView } = require('../src/shared/responseShapers');
    const shaped = shapeAppointmentTherapistView({
      _id: '507f1f77bcf86cd799439011',
      __v: 0,
      status: 'confirmed',
      user: { _id: '507f1f77bcf86cd799439099', name: 'Patient', email: 'p@test.com', password: 'secret' },
    });
    expect(shaped._id).toBe('507f1f77bcf86cd799439011');
    expect(shaped.user._id).toBe('507f1f77bcf86cd799439099');
    expect(shaped.user.password).toBeUndefined();
  });
});

describe('Community & wellness DTO layer', () => {
  test('shapeGroupSession exposes id and _id without __v', () => {
    const { shapeGroupSession } = require('../src/shared/responseShapers');
    const shaped = shapeGroupSession({
      _id: '507f1f77bcf86cd799439011',
      __v: 0,
      title: 'Anxiety Circle',
      description: 'Weekly support',
      scheduledDate: new Date('2026-06-15'),
      meetingLink: 'https://meet.jit.si/test',
      participants: ['507f1f77bcf86cd799439099'],
      maxParticipants: 10,
    });
    expect(shaped.__v).toBeUndefined();
    expect(shaped._id).toBe('507f1f77bcf86cd799439011');
    expect(shaped.participants).toEqual(['507f1f77bcf86cd799439099']);
  });

  test('shapePeerConnection maps the other user', () => {
    const { shapePeerConnection } = require('../src/shared/responseShapers');
    const shaped = shapePeerConnection({
      _id: '507f1f77bcf86cd799439011',
      requester: { _id: '507f1f77bcf86cd799439022', name: 'Me' },
      recipient: { _id: '507f1f77bcf86cd799439033', name: 'Peer' },
      sharedConcerns: ['anxiety'],
      updatedAt: new Date('2026-06-01'),
    }, '507f1f77bcf86cd799439022');
    expect(shaped.userId).toBe('507f1f77bcf86cd799439033');
    expect(shaped.userName).toBe('Peer');
  });

  test('shapeStreaksResponse enriches badges with metadata', () => {
    const { shapeStreaksResponse } = require('../src/shared/responseShapers');
    const shaped = shapeStreaksResponse({
      streak: { currentStreak: 3, longestStreak: 5, totalCheckins: 12 },
      badges: [{ badgeKey: 'mood_explorer', earnedAt: new Date(), seen: false, __v: 0 }],
      badgeMeta: { mood_explorer: { label: 'Mood Explorer', icon: 'compass' } },
      streakThresholds: [{ key: 'week_warrior', target: 7 }],
      checkinThresholds: [{ key: 'mood_explorer', target: 10 }],
    });
    expect(shaped.badges[0].label).toBe('Mood Explorer');
    expect(shaped.badges[0].__v).toBeUndefined();
    expect(shaped.nextStreakGoal.target).toBe(7);
  });
});

describe('Therapist DTO layer', () => {
  test('shapeTherapistListing strips __v and stringifies id', () => {
    const { shapeTherapistListing } = require('../src/shared/responseShapers');
    const shaped = shapeTherapistListing({
      _id: '507f1f77bcf86cd799439011',
      name: 'Dr. Test',
      specialisation: 'Psychologist',
      email: 'dr@test.com',
      __v: 0,
    });
    expect(shaped.__v).toBeUndefined();
    expect(shaped.id).toBe('507f1f77bcf86cd799439011');
    expect(shaped.name).toBe('Dr. Test');
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
