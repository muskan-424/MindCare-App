import axios from 'axios';
import { api_route } from '../../src/utils/route';

export function createAdminClient(adminToken) {
  const client = axios.create({
    baseURL: api_route,
  });

  client.interceptors.request.use((config) => {
    if (adminToken) {
      config.headers['x-admin-token'] = adminToken;
    }
    return config;
  });

  return {
    getUsers: () => client.get('/api/admin/users').then((r) => r.data),
    getIssuesForUser: (userId) =>
      client.get('/api/admin/issues', { params: { userId } }).then((r) => r.data),
    getMoodForUser: (userId) =>
      client.get('/api/admin/mood', { params: { userId } }).then((r) => r.data),
  };
}

