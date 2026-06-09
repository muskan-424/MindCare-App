/**
 * featureFlags.js
 * Lightweight client feature flags + defaults for the Tink assistant.
 * Mirrors the backend .env switches (FEATURE_FLAG_AI_CHAT, DEFAULT_CHAT_TONE)
 * so the chat entry points and behaviour can be toggled without code edits.
 *
 * These are build-time defaults; wire them to remote config later if needed.
 */

export const FEATURE_FLAGS = {
  // Show/hide the Tink chat entry points across the app.
  aiChat: true,
  // Show the chat history screen + button.
  chatHistory: true,
  // Show intent/confidence/source debug badges in the chat.
  chatDebugBadges: true,
  // Allow draft actions (log mood / journal / goal / book session) from chat.
  chatActions: true,
};

// Default conversational tone: 'friendly' | 'professional' | 'concise'
export const DEFAULT_CHAT_TONE = 'friendly';

export const CHAT_TONES = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'professional', label: 'Professional' },
  { id: 'concise', label: 'Concise' },
];
