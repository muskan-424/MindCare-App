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
    getAnalytics: () => client.get('/api/admin/analytics').then((r) => r.data),
    getPending: () => client.get('/api/admin/pending-verification').then((r) => r.data),
    getUsers: () => client.get('/api/admin/users').then((r) => r.data),
    getTherapists: () => client.get('/api/admin/therapists').then((r) => r.data),
    getAppointments: (status) =>
      client.get('/api/admin/appointments', { params: status ? { status } : {} }).then((r) => r.data),
    getTherapistAvailability: (therapistId, date, appointmentId) =>
      client.get('/api/admin/therapist-availability', {
        params: { therapistId, date, appointmentId },
      }).then((r) => r.data),
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
    verifyEmergencyContact: (id, body) =>
      client.patch(`/api/admin/emergency-contacts/${id}/verify`, body).then((r) => r.data),
    rejectEmergencyContact: (id, body) =>
      client.patch(`/api/admin/emergency-contacts/${id}/reject`, body).then((r) => r.data),
    reviewDeletionRequest: (id, body) =>
      client.patch(`/api/admin/deletion-requests/${id}/review`, body).then((r) => r.data),
    assignAppointment: (id, body) =>
      client.post(`/api/admin/appointments/${id}/assign`, body).then((r) => r.data),
    updateAppointmentStatus: (id, body) =>
      client.patch(`/api/admin/appointments/${id}/status`, body).then((r) => r.data),
    broadcastNotification: (body) =>
      client.post('/api/admin/notifications/broadcast', body).then((r) => r.data),
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
