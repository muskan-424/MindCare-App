/**
 * tinkChat.js
 * Frontend client for the Tink chatbot. Routes all conversation traffic
 * through the secure backend (/api/chat) instead of calling Gemini directly
 * from the device — so the API key stays server-side and we get RAG,
 * memory, multilingual replies, suggestions, crisis detection and persistence.
 */

import api from './apiClient';

/**
 * Send a message to Tink.
 * @param {Object} params
 * @param {string} params.message
 * @param {Array<{role?: string, isUser?: boolean, text: string}>} [params.history]
 * @param {string} [params.conversationId]
 * @param {string} [params.language]
 * @returns {Promise<{reply, suggestions, cards, crisis, mood, detectedLanguage, conversationId}>}
 */
export async function sendChatMessage({ message, history = [], conversationId, language = 'en', tone }) {
  const payload = {
    message,
    history: history.map(m => ({
      isUser: m.isUser != null ? m.isUser : m.role === 'user',
      text: m.text,
    })),
    language,
  };
  if (conversationId) payload.conversationId = conversationId;
  if (tone) payload.tone = tone;

  const res = await api.post('/api/chat', payload);
  const data = res.data || {};
  return {
    reply: data.reply || "I'm here with you.",
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    cards: Array.isArray(data.cards) ? data.cards : [],
    crisis: Boolean(data.crisis),
    mood: data.mood || 'neutral',
    detectedLanguage: data.detectedLanguage || language,
    intent: data.intent || 'support',
    confidence: typeof data.confidence === 'number' ? data.confidence : null,
    sources: Array.isArray(data.sources) ? data.sources : [],
    draft: data.draft || null,
    mode: data.mode || 'rule',
    toolTraces: Array.isArray(data.toolTraces) ? data.toolTraces : [],
    conversationId: data.conversationId || conversationId || null,
    verificationNote: data.verificationNote || null,
    modelTier: data.modelTier || null,
  };
}

/** Rewrite a previous reply in a style: shorter | professional | simpler | steps. */
export async function refineMessage({ text, mode = 'shorter', language = 'en' }) {
  const res = await api.post('/api/chat/refine', { text, mode, language });
  return res.data?.text || text;
}

/** Translate arbitrary text into a target language. */
export async function translateMessage({ text, targetLanguage = 'en' }) {
  const res = await api.post('/api/chat/translate', { text, targetLanguage });
  return res.data?.text || text;
}

/** Report Tink's live capabilities (Gemini vs rule-based, RAG mode, voice…). */
export async function getCapabilities() {
  try {
    const res = await api.get('/api/chat/capabilities');
    return res.data || {};
  } catch (_) {
    return { geminiLive: false, mode: 'rule', ragMode: 'local', voice: true, confidenceGate: 0.45 };
  }
}

/**
 * Commit a draft action (mood / journal / goal / appointment) the user
 * confirmed in a review card. Posts the draft payload to its REST endpoint.
 */
export async function commitDraft(draft) {
  if (!draft || !draft.commit || !draft.commit.endpoint) {
    throw new Error('Invalid draft');
  }
  const { method = 'POST', endpoint, payload = {} } = draft.commit;
  const verb = String(method).toLowerCase();
  const res = await api[verb](endpoint, payload);
  return res.data;
}

/** List the current user's saved conversations. */
export async function getConversations() {
  const res = await api.get('/api/chat/conversations');
  return Array.isArray(res.data) ? res.data : [];
}

/** Fetch the full transcript of one conversation. */
export async function getConversation(id) {
  const res = await api.get(`/api/chat/conversations/${id}`);
  return res.data;
}

/** Delete a conversation. */
export async function deleteConversation(id) {
  const res = await api.delete(`/api/chat/conversations/${id}`);
  return res.data;
}
