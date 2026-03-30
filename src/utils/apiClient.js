import axios from 'axios';
import { api_route } from './route';

// Shared API client with verbose logging so you can see
// every request/response in Metro / devtools.
const api = axios.create({
  baseURL: api_route,
  timeout: 60000, // 60s — allows time for Render cold start (free tier can take 30-60s to wake)
});

api.interceptors.request.use(
  config => {
    // Auto-inject JWT token from Redux store into every request
    try {
      const store = require('../redux/store').default;
      const token = store.getState()?.auth?.token;
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) { /* ignore store errors */ }

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
    return config;
  },
  error => {
    console.log('[API REQUEST ERROR BEFORE SEND]', error?.message);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  response => {
    try {
      const { config, status, data } = response;
      console.log(
        '[API RESPONSE]',
        (config?.method || 'GET').toUpperCase(),
        `${config?.baseURL || ''}${config?.url || ''}`,
        '\n  status:',
        status,
        '\n  data:',
        data,
      );
    } catch (e) {
      console.log('[API RESPONSE LOG ERROR]', e.message);
    }
    return response;
  },
  error => {
    try {
      const { response, config } = error;
      if (response) {
        console.log(
          '[API ERROR]',
          (config?.method || 'GET').toUpperCase(),
          `${config?.baseURL || ''}${config?.url || ''}`,
          '\n  status:',
          response.status,
          '\n  data:',
          response.data,
        );
      } else {
        console.log('[API ERROR WITHOUT RESPONSE]', error.message);
      }
    } catch (e) {
      console.log('[API ERROR LOG ERROR]', e.message);
    }
    return Promise.reject(error);
  },
);

export default api;

