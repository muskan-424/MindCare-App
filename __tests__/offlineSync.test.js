import AsyncStorage from '@react-native-async-storage/async-storage';
import * as offlineSync from '../src/utils/offlineSync';
import api from '../src/utils/apiClient';

// Mock the apiClient module
jest.mock('../src/utils/apiClient', () => {
  return {
    __esModule: true,
    default: {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    },
  };
});

// Mock the global fetch
global.fetch = jest.fn();

describe('OfflineSync Utility Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    offlineSync.setOffline(false);
  });

  describe('Connection status', () => {
    it('should ping backend successfully and return true', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'MindCare API is running' }),
      });

      const online = await offlineSync.checkOnlineStatus();
      expect(online).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return false if ping fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network Error'));

      const online = await offlineSync.checkOnlineStatus();
      expect(online).toBe(false);
    });

    it('should manage and notify listeners when status changes', () => {
      const callback = jest.fn();
      const unsubscribe = offlineSync.subscribe(callback);

      expect(offlineSync.isOffline()).toBe(false);

      offlineSync.setOffline(true);
      expect(offlineSync.isOffline()).toBe(true);
      expect(callback).toHaveBeenCalledWith(true);

      unsubscribe();
      offlineSync.setOffline(false);
      expect(callback).toHaveBeenCalledTimes(1); // not called again after unsubscribe
    });
  });

  describe('Caching responses', () => {
    it('should cache and retrieve GET responses', async () => {
      const url = '/api/mood/stats';
      const params = { foo: 'bar' };
      const testData = { average: 7.5, streak: 4 };

      await offlineSync.cacheResponse(url, params, testData);
      
      const cached = await offlineSync.getCachedResponse(url, params);
      expect(cached).toEqual(testData);

      const rawValue = await AsyncStorage.getItem('MindCare_cache_api_mood_stats_{"foo":"bar"}');
      expect(rawValue).not.toBeNull();
      expect(JSON.parse(rawValue)).toEqual(testData);
    });
  });

  describe('Queuing and replaying requests', () => {
    it('should enqueue requests and set offline mode to true', async () => {
      const config = {
        url: '/api/journals',
        method: 'POST',
        data: { content: 'Offline post' },
        headers: { 'Content-Type': 'application/json' },
      };

      await offlineSync.enqueueRequest(config);

      expect(offlineSync.isOffline()).toBe(true);

      const queueRaw = await AsyncStorage.getItem('MindCare_offline_queue');
      const queue = JSON.parse(queueRaw);
      expect(queue).toHaveLength(1);
      expect(queue[0].config.url).toBe('/api/journals');
      expect(queue[0].config.method).toBe('POST');
      expect(queue[0].config.data).toEqual({ content: 'Offline post' });
    });

    it('should replay successful enqueued requests and clear the queue', async () => {
      const config = {
        url: '/api/mood',
        method: 'POST',
        data: { rating: 8 },
      };

      await offlineSync.enqueueRequest(config);

      // Setup api.request to succeed
      api.request.mockResolvedValueOnce({ status: 201, data: { success: true } });

      await offlineSync.syncQueue();

      expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
        url: '/api/mood',
        method: 'POST',
        skipOfflineInterceptor: true,
      }));

      const queueRaw = await AsyncStorage.getItem('MindCare_offline_queue');
      const queue = JSON.parse(queueRaw);
      expect(queue).toHaveLength(0);
    });

    it('should discard requests that fail with client-side 400 errors', async () => {
      const config = {
        url: '/api/mood',
        method: 'POST',
        data: { rating: 99 }, // invalid rating
      };

      await offlineSync.enqueueRequest(config);

      const clientError = new Error('Bad Request');
      clientError.response = { status: 400 };

      api.request.mockRejectedValueOnce(clientError);

      await offlineSync.syncQueue();

      // Should be removed because it was a 400 error (unrecoverable client error)
      const queueRaw = await AsyncStorage.getItem('MindCare_offline_queue');
      const queue = JSON.parse(queueRaw);
      expect(queue).toHaveLength(0);
    });

    it('should retain requests in queue if a network failure occurs during sync', async () => {
      const config = {
        url: '/api/mood',
        method: 'POST',
        data: { rating: 5 },
      };

      await offlineSync.enqueueRequest(config);

      const networkError = new Error('Network Error');
      api.request.mockRejectedValueOnce(networkError);

      await offlineSync.syncQueue();

      // Should retain in the queue
      const queueRaw = await AsyncStorage.getItem('MindCare_offline_queue');
      const queue = JSON.parse(queueRaw);
      expect(queue).toHaveLength(1);
      expect(offlineSync.isOffline()).toBe(true);
    });
  });

  describe('updateOfflineCaches helper', () => {
    it('should update cached journals array', async () => {
      // 1. Setup cache
      const initialJournals = [{ id: '1', content: 'Old journal' }];
      await offlineSync.cacheResponse('/api/journals', null, initialJournals);

      // 2. Call updateOfflineCaches
      const newJournal = { id: 'offline_j_123', content: 'New offline journal', offline: true };
      await offlineSync.updateOfflineCaches('POST', '/api/journals', { content: 'New offline journal' }, newJournal);

      // 3. Verify
      const cached = await offlineSync.getCachedResponse('/api/journals');
      expect(cached).toHaveLength(2);
      expect(cached[0]).toEqual(newJournal);
      expect(cached[1]).toEqual(initialJournals[0]);
    });

    it('should update cached goals array on post, patch, and delete', async () => {
      // 1. POST goal
      const initialGoals = [];
      await offlineSync.cacheResponse('/api/goals', null, initialGoals);

      const newGoal = { _id: 'goal_123', title: 'Goal 1', progress: 0, milestones: [{ _id: 'ms_1', completed: false }] };
      await offlineSync.updateOfflineCaches('POST', '/api/goals', null, newGoal);

      let cached = await offlineSync.getCachedResponse('/api/goals');
      expect(cached).toHaveLength(1);
      expect(cached[0]).toEqual(newGoal);

      // 2. PATCH progress
      await offlineSync.updateOfflineCaches('PATCH', '/api/goals/goal_123/progress', { progress: 50 }, null);
      cached = await offlineSync.getCachedResponse('/api/goals');
      expect(cached[0].progress).toBe(50);

      // 3. PATCH milestone toggle
      await offlineSync.updateOfflineCaches('PATCH', '/api/goals/goal_123/milestone/ms_1', null, null);
      cached = await offlineSync.getCachedResponse('/api/goals');
      expect(cached[0].milestones[0].completed).toBe(true);
      expect(cached[0].progress).toBe(100); // completed 1/1 milestone -> 100%

      // 4. DELETE goal
      await offlineSync.updateOfflineCaches('DELETE', '/api/goals/goal_123', null, null);
      cached = await offlineSync.getCachedResponse('/api/goals');
      expect(cached).toHaveLength(0);
    });
  });
});
