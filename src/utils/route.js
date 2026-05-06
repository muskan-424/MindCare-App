/**
 * ─────────────────────────────────────────────────────────────────
 *  API BASE URL — MindCare
 * ─────────────────────────────────────────────────────────────────
 *
 *  CURRENT MODE: ✅ LOCAL backend via ADB Reverse
 *
 *  ⚠️ The Render cloud service (mindcare-api.onrender.com) is NOT
 *     currently active — it returns 404. Until you redeploy it,
 *     the app MUST use the local backend below.
 *
 *  HOW TO FIX "404 / Network Error":
 *    Since you are using Wireless Debugging on a restricted Wi-Fi
 *    (which isolates clients) or Windows Firewall is blocking inbound
 *    requests, we are using an ADB tunnel!
 *    
 *    If you get a network error again, run this in your terminal:
 *    👉 adb reverse tcp:5000 tcp:5000
 *
 *    Then the app can safely use 127.0.0.1 to reach your PC!
 *
 *  TO SWITCH TO CLOUD (once Render is redeployed):
 *    → Change the last line from LOCAL_URL to RENDER_URL
 * ─────────────────────────────────────────────────────────────────
 */

// ✏️ Using localhost via adb reverse (bypasses Windows Firewall & WiFi AP Isolation)
const DEV_MACHINE_IP = '127.0.0.1';
const DEV_PORT = 5000;

// Local backend URL — routed over the ADB tunnel
const LOCAL_URL = `http://${DEV_MACHINE_IP}:${DEV_PORT}`;

// Cloud URL — only use this when your Render service is confirmed live
const RENDER_URL = 'https://mindcare-api.onrender.com';

// ─── ACTIVE SELECTION ─────────────────────────────────────────────
// Switch to RENDER_URL only after confirming https://mindcare-api.onrender.com is live
export const api_route = LOCAL_URL;

