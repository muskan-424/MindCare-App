const jobQueue = require('../jobs/jobQueue');
const { getNotificationProvider, _resetProvider } = require('../src/domains/admin/services/providers/notifications');

describe('jobQueue', () => {
  afterEach(() => jobQueue.stopAll());

  test('runs a registered handler when a job is enqueued', async () => {
    const seen = [];
    jobQueue.register('test.echo', async (payload) => { seen.push(payload.value); });
    jobQueue.enqueue('test.echo', { value: 42 });
    await jobQueue.drain();
    expect(seen).toEqual([42]);
  });

  test('an unknown job name does not throw', async () => {
    jobQueue.enqueue('test.does-not-exist', {});
    await expect(jobQueue.drain()).resolves.toBeUndefined();
  });

  test('a throwing handler is isolated and does not break the queue', async () => {
    const seen = [];
    jobQueue.register('test.boom', async () => { throw new Error('kaboom'); });
    jobQueue.register('test.ok', async () => { seen.push('ok'); });
    jobQueue.enqueue('test.boom', {});
    jobQueue.enqueue('test.ok', {});
    await jobQueue.drain();
    expect(seen).toEqual(['ok']);
  });

  test('schedule with runImmediately enqueues once right away', async () => {
    let calls = 0;
    jobQueue.register('test.tick', async () => { calls += 1; });
    jobQueue.schedule('test.tick', 60000, {}, true);
    await jobQueue.drain();
    expect(calls).toBe(1);
  });
});

describe('notification provider factory', () => {
  afterEach(() => _resetProvider());

  test('defaults to a console provider that sends successfully', async () => {
    const provider = getNotificationProvider();
    expect(provider.name).toBe('ConsoleNotificationProvider');
    const result = await provider.send({ to: 'u1', title: 'Hi', body: 'There' });
    expect(result.ok).toBe(true);
  });

  test('returns a cached singleton', () => {
    expect(getNotificationProvider()).toBe(getNotificationProvider());
  });

  test('falls back to console for an unknown provider key', async () => {
    process.env.NOTIFICATION_PROVIDER = 'carrier-pigeon';
    _resetProvider();
    const provider = getNotificationProvider();
    expect(provider.name).toBe('ConsoleNotificationProvider');
    delete process.env.NOTIFICATION_PROVIDER;
  });
});

describe('RAG reindex job', () => {
  test('rag.reindex handler is registered and skips when Pinecone is off', async () => {
    const { jobQueue } = require('../jobs');
    const { reindexHelpDocs } = require('../src/domains/community/services/tinkRagService');
    expect(jobQueue._handlers.has('rag.reindex')).toBe(true);
    const result = await reindexHelpDocs();
    expect(result.upserted).toBe(0);
    expect(result.skipped).toBe(true);
  });
});
