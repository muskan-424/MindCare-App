import axios from 'axios';
import { api_route } from './route';

// Shared API client with verbose logging so you can see
// every request/response in Metro / devtools.
const api = axios.create({
  baseURL: api_route,
  timeout: 15000,
});

api.interceptors.request.use(
  config => {
    try {
      const { method, url, baseURL, params, data, headers } = config;
      console.log(
        '[API REQUEST]',
        (method || 'GET').toUpperCase(),
        `${baseURL || ''}${url || ''}`,
        '\n  params:',
        params || null,
        '\n  data:',
        data || null,
        '\n  headers:',
        headers || null,
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

