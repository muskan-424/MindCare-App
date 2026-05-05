/**
 * ─────────────────────────────────────────────────────────────────
 *  API BASE URL — MindCare
 * ─────────────────────────────────────────────────────────────────
 *  The backend is deployed to Render at a permanent HTTPS URL.
 *  No more IP addresses. No more "Network Error" on WiFi changes.
 *  Works on any device, any network, anywhere in the world.
 *
 *  ✅ PRODUCTION / APP USAGE  →  Render cloud URL (always)
 *  🛠  LOCAL BACKEND DEV ONLY →  Uncomment DEV_URL below and swap
 *      api_route to DEV_URL when you are actively changing backend
 *      code and want to test without deploying.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Cloud backend (permanent — never changes) ──────────────────
const RENDER_URL = 'https://mindcare-api.onrender.com';

// ── Local dev override (only needed when editing backend code) ──
// Update DEV_MACHINE_IP with your current IP from `ipconfig` if you need this
// const DEV_MACHINE_IP = '192.168.1.5';
// const DEV_URL = `http://${DEV_MACHINE_IP}:5000`;

// Admin web portal running locally always hits localhost
const isAdminLocalhost =
  typeof window !== 'undefined' &&
  window.location &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const api_route = isAdminLocalhost ? 'http://localhost:5000' : RENDER_URL;
