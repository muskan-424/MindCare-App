import AsyncStorage from '@react-native-async-storage/async-storage';
import { api_route } from './route';

const QUEUE_KEY = 'MindCare_offline_queue';
const CACHE_PREFIX = 'MindCare_cache_';

let isAppOffline = false;
const listeners = new Set();

/**
 * Perform a lightweight network ping to verify actual connection to the backend.
 */
export const checkOnlineStatus = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${api_route}/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Check if the application is offline (based on cached state).
 */
export const isOffline = () => isAppOffline;

/**
 * Set the offline state and notify all subscribed listeners.
 */
export const setOffline = (offline) => {
  if (isAppOffline !== offline) {
    isAppOffline = offline;
    listeners.forEach((listener) => {
      try {
        listener(isAppOffline);
      } catch (e) {
        console.warn('OfflineSync status listener error:', e);
      }
    });
  }
};

/**
 * Subscribe to offline status changes.
 */
export const subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Generate a cache key for a GET request.
 */
const getCacheKey = (url, params) => {
  const cleanUrl = url.replace(/^\//, '').replace(/\//g, '_');
  const paramStr = params ? `_${JSON.stringify(params)}` : '';
  return `${CACHE_PREFIX}${cleanUrl}${paramStr}`;
};

/**
 * Cache GET response data.
 */
export const cacheResponse = async (url, params, data) => {
  try {
    const key = getCacheKey(url, params);
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[OfflineSync] Failed to cache response:', e.message);
  }
};

/**
 * Retrieve cached GET response data.
 */
export const getCachedResponse = async (url, params) => {
  try {
    const key = getCacheKey(url, params);
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('[OfflineSync] Failed to get cached response:', e.message);
    return null;
  }
};

/**
 * Enqueue a mutating request (POST/PATCH/DELETE).
 */
export const enqueueRequest = async (requestConfig) => {
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = queueData ? JSON.parse(queueData) : [];
    
    // Add unique metadata for recovery/sync
    const entry = {
      id: `offline_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      config: {
        url: requestConfig.url,
        method: requestConfig.method,
        data: requestConfig.data,
        headers: requestConfig.headers,
      },
    };

    queue.push(entry);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('[OfflineSync] Enqueued mutating request:', requestConfig.method, requestConfig.url);
    setOffline(true);
  } catch (e) {
    console.warn('[OfflineSync] Failed to enqueue request:', e.message);
  }
};

/**
 * Sequentially replay all enqueued requests in the queue.
 */
export const syncQueue = async () => {
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueData) return;
    
    const queue = JSON.parse(queueData);
    if (queue.length === 0) return;

    console.log(`[OfflineSync] Syncing queue of ${queue.length} items...`);
    
    // Import api client dynamically to avoid circular dependencies
    const api = require('./apiClient').default;
    const remainingQueue = [...queue];

    for (const item of queue) {
      try {
        console.log(`[OfflineSync] Replaying request: ${item.config.method} ${item.config.url}`);
        // Execute request through normal apiClient skipping interceptor error triggers
        await api.request({
          ...item.config,
          skipOfflineInterceptor: true,
        });
        
        // Remove item from active checklist
        const idx = remainingQueue.findIndex((q) => q.id === item.id);
        if (idx !== -1) {
          remainingQueue.splice(idx, 1);
        }
      } catch (error) {
        console.warn(`[OfflineSync] Replay failed for ${item.config.url}:`, error.message);
        
        // If it failed due to a server-side client error (4xx except 408/429), discard it since it's malformed
        if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 408 && error.response.status !== 429) {
          console.warn('[OfflineSync] Discarding invalid request:', item.config.url);
          const idx = remainingQueue.findIndex((q) => q.id === item.id);
          if (idx !== -1) {
            remainingQueue.splice(idx, 1);
          }
          continue;
        }

        // If it's a network error (no connection), stop replaying the queue, keep remaining, keep offline state
        setOffline(true);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
        return;
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    if (remainingQueue.length === 0) {
      console.log('[OfflineSync] Sync complete. All requests replayed successfully.');
    }
  } catch (e) {
    console.warn('[OfflineSync] Error syncing queue:', e.message);
  }
};

/**
 * Update locally cached GET data for specific endpoints to provide immediate UI updates when offline.
 */
export const updateOfflineCaches = async (method, url, requestData, responseData) => {
  try {
    const cleanMethod = (method || '').toLowerCase();
    
    // 1. Journal POST cache update
    if (cleanMethod === 'post' && url.startsWith('/api/journals')) {
      const cached = await getCachedResponse('/api/journals');
      if (Array.isArray(cached)) {
        cached.unshift(responseData);
        await cacheResponse('/api/journals', null, cached);
      }
    }

    // 2. Goals POST cache update
    if (cleanMethod === 'post' && url.startsWith('/api/goals')) {
      const cached = await getCachedResponse('/api/goals');
      if (Array.isArray(cached)) {
        cached.unshift(responseData);
        await cacheResponse('/api/goals', null, cached);
      }
    }

    // 3. Goals DELETE cache update
    if (cleanMethod === 'delete' && url.startsWith('/api/goals/')) {
      const goalId = url.split('/').pop();
      const cached = await getCachedResponse('/api/goals');
      if (Array.isArray(cached)) {
        const filtered = cached.filter(g => String(g._id) !== String(goalId));
        await cacheResponse('/api/goals', null, filtered);
      }
    }

    // 4. Goals PATCH progress cache update
    if (cleanMethod === 'patch' && url.includes('/progress')) {
      const parts = url.split('/');
      const goalId = parts[parts.length - 2];
      const cached = await getCachedResponse('/api/goals');
      if (Array.isArray(cached)) {
        const updated = cached.map(g => {
          if (String(g._id) === String(goalId)) {
            return { ...g, progress: requestData ? requestData.progress : g.progress };
          }
          return g;
        });
        await cacheResponse('/api/goals', null, updated);
      }
    }

    // 5. Goals PATCH milestone cache update
    if (cleanMethod === 'patch' && url.includes('/milestone/')) {
      const parts = url.split('/');
      const goalId = parts[3];
      const msId = parts[5];
      const cached = await getCachedResponse('/api/goals');
      if (Array.isArray(cached)) {
        const updated = cached.map(g => {
          if (String(g._id) === String(goalId)) {
            const updatedMilestones = (g.milestones || []).map(m => {
              if (String(m._id) === String(msId)) {
                return { ...m, completed: !m.completed };
              }
              return m;
            });
            const completedCount = updatedMilestones.filter(m => m.completed).length;
            const totalCount = updatedMilestones.length;
            const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : g.progress;
            return { ...g, milestones: updatedMilestones, progress: newProgress };
          }
          return g;
        });
        await cacheResponse('/api/goals', null, updated);
      }
    }

    // 6. Mood POST cache update
    if (cleanMethod === 'post' && url.startsWith('/api/mood')) {
      const keys = await AsyncStorage.getAllKeys();
      const trendKeys = keys.filter(k => k.startsWith('MindCare_cache_api_mood_trend'));
      
      const rating = responseData.rating;
      const note = responseData.note || '';
      const dateStr = new Date(responseData.date).toISOString().slice(0, 10);

      for (const k of trendKeys) {
        try {
          const val = await AsyncStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && Array.isArray(parsed.trend)) {
              let found = false;
              const updatedTrend = parsed.trend.map(t => {
                if (t.date === dateStr) {
                  found = true;
                  return {
                    ...t,
                    rating: t.rating == null ? rating : (t.rating + rating) / 2,
                    note: note || t.note,
                    count: (t.count || 0) + 1
                  };
                }
                return t;
              });
              if (!found) {
                updatedTrend.push({ date: dateStr, rating, note, count: 1 });
              }
              await AsyncStorage.setItem(k, JSON.stringify({ ...parsed, trend: updatedTrend }));
            }
          }
        } catch (e) {
          console.warn('[OfflineSync] Failed to update trend cache k:', k, e.message);
        }
      }

      const statsVal = await AsyncStorage.getItem('MindCare_cache_api_mood_stats');
      if (statsVal) {
        try {
          const stats = JSON.parse(statsVal);
          const oldTotal = stats.totalEntries || 0;
          const oldAvg = stats.average || 0;
          const newTotal = oldTotal + 1;
          const newAvg = Number(((oldAvg * oldTotal + rating) / newTotal).toFixed(1));
          
          await AsyncStorage.setItem('MindCare_cache_api_mood_stats', JSON.stringify({
            ...stats,
            totalEntries: newTotal,
            average: newAvg,
            streak: (stats.streak || 0) + 1,
          }));
        } catch (e) {
          console.warn('[OfflineSync] Failed to update stats cache:', e.message);
        }
      }
    }
  } catch (e) {
    console.warn('[OfflineSync] updateOfflineCaches failed:', e.message);
  }
};

/**
 * Start a periodic sync checker.
 */
let syncIntervalId = null;
export const startSyncInterval = (intervalMs = 30000) => {
  if (syncIntervalId) return;

  syncIntervalId = setInterval(async () => {
    const online = await checkOnlineStatus();
    if (online) {
      setOffline(false);
      await syncQueue();
    } else {
      setOffline(true);
    }
  }, intervalMs);
};

export const stopSyncInterval = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};
