import axios from 'axios';
import { api_route } from './route';
import * as offlineSync from './offlineSync';

// Helper to safely parse request data
const parseData = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data;
};

// Check if a request is a target for offline queueing (mutating endpoints)
const isTargetForQueue = (method, url) => {
  if (!url) return false;
  const cleanMethod = (method || '').toLowerCase();
  if (cleanMethod === 'get') return false;
  
  const targets = ['/api/mood', '/api/journals', '/api/goals'];
  return targets.some(target => url.startsWith(target));
};

// Check if a request is a target for caching (GET endpoints)
const isTargetForCache = (method, url) => {
  if (!url) return false;
  const cleanMethod = (method || '').toLowerCase();
  if (cleanMethod !== 'get') return false;
  
  const targets = ['/api/mood', '/api/journals', '/api/goals'];
  return targets.some(target => url.startsWith(target));
};

// Create a mocked successful response for enqueued mutating requests
const createMockResponse = (config) => {
  const url = config.url || '';
  const parsedData = parseData(config.data);
  const method = (config.method || '').toLowerCase();

  let responseData = { offline: true };

  if (url.startsWith('/api/journals')) {
    responseData = {
      id: `offline_j_${Date.now()}`,
      content: parsedData.content || '',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      riskLevel: 'LOW',
      aiInsight: 'You are currently offline. Tink will analyze this entry when connection returns.',
      emotionTags: [],
      sentimentScore: 0,
      offline: true,
    };
  } else if (url.startsWith('/api/mood')) {
    responseData = {
      id: `offline_m_${Date.now()}`,
      date: new Date().toISOString(),
      rating: parsedData.rating || 5,
      note: parsedData.note || '',
      offline: true,
    };
  } else if (url.startsWith('/api/goals')) {
    if (method === 'post') {
      responseData = {
        _id: `offline_g_${Date.now()}`,
        title: parsedData.title || '',
        description: parsedData.description || '',
        category: parsedData.category || 'mental_health',
        targetDate: parsedData.targetDate || '',
        milestones: (parsedData.milestones || []).map((m, idx) => ({
          ...m,
          _id: `offline_ms_${idx}_${Date.now()}`,
          completed: false
        })),
        progress: 0,
        status: 'active',
        offline: true,
      };
    } else {
      responseData = { status: 'success', offline: true };
    }
  }

  return {
    data: responseData,
    status: method === 'post' ? 201 : 200,
    statusText: method === 'post' ? 'Created' : 'OK',
    headers: {},
    config,
  };
};

const api = axios.create({
  baseURL: api_route,
  timeout: 60000,
});

api.interceptors.request.use(
  async (config) => {
    // Inject JWT token from Redux store into every request
    try {
      const store = require('../redux/store').default;
      const token = store.getState()?.auth?.token;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) { /* ignore store errors */ }

    // Log request
    try {
      const { method, url, baseURL, params, data } = config;
      console.log(
        '[API REQUEST]',
        (method || 'GET').toUpperCase(),
        `${baseURL || ''}${url || ''}`,
        '\n  params:', params || null,
        '\n  data:', data || null,
      );
    } catch (e) {
      console.log('[API REQUEST LOG ERROR]', e.message);
    }

    // Intercept immediately if we are offline and skipOfflineInterceptor is false
    if (!config.skipOfflineInterceptor) {
      if (isTargetForCache(config.method, config.url) && offlineSync.isOffline()) {
        const cached = await offlineSync.getCachedResponse(config.url, config.params);
        if (cached) {
          console.log('[API INTERCEPTED GET - CACHE HIT]', config.url);
          return Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
        }
      }

      if (isTargetForQueue(config.method, config.url) && offlineSync.isOffline()) {
        console.log('[API INTERCEPTED MUTATION - ENQUEUEING]', config.method, config.url);
        const mockResponse = createMockResponse(config);
        await offlineSync.enqueueRequest(config);
        await offlineSync.updateOfflineCaches(config.method, config.url, parseData(config.data), mockResponse.data);
        return Promise.resolve(mockResponse);
      }
    }

    return config;
  },
  (error) => {
    console.log('[API REQUEST ERROR BEFORE SEND]', error?.message);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  async (response) => {
    const { config, status, data } = response;
    
    // Log response
    try {
      console.log(
        '[API RESPONSE]',
        (config?.method || 'GET').toUpperCase(),
        `${config?.baseURL || ''}${config?.url || ''}`,
        '\n  status:', status,
        '\n  data:', data,
      );
    } catch (e) {
      console.log('[API RESPONSE LOG ERROR]', e.message);
    }

    // Cache successful GET responses and set online state
    if (!config.skipOfflineInterceptor) {
      offlineSync.setOffline(false);
      
      if (isTargetForCache(config.method, config.url)) {
        await offlineSync.cacheResponse(config.url, config.params, data);
      }
    }

    return response;
  },
  async (error) => {
    const { response, config } = error;
    
    // Log error
    try {
      if (response) {
        console.log(
          '[API ERROR]',
          (config?.method || 'GET').toUpperCase(),
          `${config?.baseURL || ''}${config?.url || ''}`,
          '\n  status:', response.status,
          '\n  data:', response.data,
        );
      } else {
        console.log('[API ERROR WITHOUT RESPONSE]', error.message);
      }
    } catch (e) {
      console.log('[API ERROR LOG ERROR]', e.message);
    }

    // Handle offline status if there is a network error (no response or network drop)
    const isNetworkError = !response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error');
    
    if (isNetworkError && config && !config.skipOfflineInterceptor) {
      offlineSync.setOffline(true);

      // GET request fallback
      if (isTargetForCache(config.method, config.url)) {
        const cached = await offlineSync.getCachedResponse(config.url, config.params);
        if (cached) {
          console.log('[API FALLBACK GET - CACHE HIT]', config.url);
          return Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
        }
      }

      // Mutating request fallback
      if (isTargetForQueue(config.method, config.url)) {
        console.log('[API FALLBACK MUTATION - ENQUEUEING]', config.method, config.url);
        const mockResponse = createMockResponse(config);
        await offlineSync.enqueueRequest(config);
        await offlineSync.updateOfflineCaches(config.method, config.url, parseData(config.data), mockResponse.data);
        return Promise.resolve(mockResponse);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
