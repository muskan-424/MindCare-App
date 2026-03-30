/**
 * Central logging for app events. Forwards UI actions directly to the Admin Telemetry backend.
 */
import store from '../redux/store';
import api from './apiClient';

const PREFIX = '[APP]';

async function sendTelemetry(action, metadata) {
  console.log(PREFIX, action, metadata);
  try {
    const state = store.getState();
    const userId = state.auth?.user?._id;
    if (!userId) return; 
    
    // Fire and forget, don't block the UI
    api.post('/api/admin/log', {
      userId,
      action,
      metadata
    }).catch(() => {});
  } catch(e) { /* ignore */ }
}

export function logTouch(eventName, extra = null) {
  const metadata = extra != null ? { ...extra } : {};
  sendTelemetry(eventName, metadata);
}

export function logScreen(screenName, params = null) {
  const metadata = params && Object.keys(params).length > 0 ? params : {};
  sendTelemetry(`Opened_Screen_${screenName}`, metadata);
}

export function logTab(tabName) {
  sendTelemetry(`Switched_Tab_${tabName}`, {});
}
