/** Production API base URL — override with VITE_API_URL at build time. */
export const API_URL = (
  import.meta.env.VITE_API_URL || 'https://mind-care-app-five.vercel.app'
).replace(/\/$/, '');
