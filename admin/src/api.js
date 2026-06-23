import axios from 'axios';
import { API_URL } from './config';

export function createAdminClient(adminToken) {
  const client = axios.create({ baseURL: API_URL });

  client.interceptors.request.use((config) => {
    if (adminToken) {
      config.headers['x-admin-token'] = adminToken;
    }
    return config;
  });

  return {
    getStats: () => client.get('/api/admin/stats').then((r) => r.data),
    getPending: () => client.get('/api/admin/pending-verification').then((r) => r.data),
    getUsers: () => client.get('/api/admin/users').then((r) => r.data),
    getIssuesForUser: (userId) =>
      client.get('/api/admin/issues', { params: { userId } }).then((r) => r.data),
    getFusionsForUser: (userId) =>
      client.get('/api/admin/fusions', { params: { userId } }).then((r) => r.data),
    getMoodForUser: (userId) =>
      client.get('/api/admin/mood', { params: { userId } }).then((r) => r.data),
    getFullProfile: (userId) =>
      client.get(`/api/admin/users/${userId}/full-profile`).then((r) => r.data),
    verifyIssue: (issueId, body) =>
      client.patch(`/api/admin/issues/${issueId}/verify`, body).then((r) => r.data),
  };
}

export const RISK_COLORS = {
  LOW: '#27ae60',
  MEDIUM: '#f39c12',
  HIGH: '#e67e22',
  CRITICAL: '#c0392b',
};

export const ADMIN_ACTIONS = [
  { value: 'none', label: 'Reviewed only' },
  { value: 'contacted', label: 'Contacted user' },
  { value: 'referred', label: 'Referred to care' },
  { value: 'resolved', label: 'Resolved' },
];
