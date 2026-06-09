/**
 * responseShapers.js
 * Central DTO helpers so API payloads stay consistent and never leak
 * Mongoose internals (password hashes, __v, etc.).
 */

const INTERNAL_KEYS = new Set(['password', '__v', '$__', '$isNew', '_doc']);

function toPlain(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(toPlain);
  if (typeof doc.toObject === 'function') return doc.toObject({ virtuals: true });
  return { ...doc };
}

function isPlainObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val)
    && Object.getPrototypeOf(val) === Object.prototype;
}

function stripInternal(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripInternal);
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (INTERNAL_KEYS.has(key)) continue;
    out[key] = isPlainObject(val) ? stripInternal(val) : val;
  }
  return out;
}

function shapeId(doc) {
  const plain = stripInternal(toPlain(doc));
  if (plain && plain._id != null) {
    const id = typeof plain._id.toHexString === 'function'
      ? plain._id.toHexString()
      : String(plain._id);
    plain.id = id;
    plain._id = id;
  }
  return plain;
}

function shapeUser(user) {
  const plain = shapeId(user);
  if (!plain) return plain;
  delete plain.password;
  return plain;
}

function shapeProfile(profile) {
  return shapeId(profile);
}

function shapeAuthResponse({ token, user, profile }) {
  return {
    token,
    user: shapeUser(user),
    profile: shapeProfile(profile),
  };
}

function shapeGoal(goal) {
  const plain = shapeId(goal);
  if (!plain) return plain;
  if (Array.isArray(plain.milestones)) {
    plain.milestones = plain.milestones.map(ms => ({
      id: ms._id ? String(ms._id) : ms.id,
      label: ms.label,
      completed: Boolean(ms.completed),
      completedAt: ms.completedAt || null,
    }));
  }
  return plain;
}

function shapeGoals(goals) {
  return (goals || []).map(shapeGoal);
}

function shapeConversationSummary(conv) {
  const plain = toPlain(conv);
  return {
    id: String(plain._id),
    title: plain.title,
    language: plain.language,
    lastMessageAt: plain.lastMessageAt,
    messageCount: Array.isArray(plain.messages) ? plain.messages.length : 0,
    preview: Array.isArray(plain.messages) && plain.messages.length
      ? String(plain.messages[plain.messages.length - 1].text || '').slice(0, 80)
      : '',
  };
}

function shapeConversationDetail(conv) {
  const plain = toPlain(conv);
  return {
    id: String(plain._id),
    title: plain.title,
    language: plain.language,
    messages: (plain.messages || []).map(m => ({
      id: m._id ? String(m._id) : undefined,
      role: m.role,
      text: m.text,
      suggestions: m.suggestions,
      cards: m.cards,
      crisis: m.crisis,
      intent: m.intent,
      confidence: m.confidence,
      sources: m.sources,
      draft: m.draft,
      mode: m.mode,
      verificationNote: m.verificationNote,
      modelTier: m.modelTier,
      createdAt: m.createdAt,
    })),
  };
}

function shapeChatResponse(payload) {
  return {
    reply: payload.reply,
    suggestions: payload.suggestions || [],
    cards: payload.cards || [],
    crisis: Boolean(payload.crisis),
    mood: payload.mood || 'neutral',
    detectedLanguage: payload.detectedLanguage || 'en',
    intent: payload.intent,
    confidence: payload.confidence,
    sources: payload.sources || [],
    draft: payload.draft || null,
    mode: payload.mode || 'rule',
    toolTraces: payload.toolTraces || [],
    conversationId: payload.conversationId || null,
    verificationNote: payload.verificationNote || undefined,
    modelTier: payload.modelTier || undefined,
  };
}

module.exports = {
  stripInternal,
  shapeUser,
  shapeProfile,
  shapeAuthResponse,
  shapeGoal,
  shapeGoals,
  shapeConversationSummary,
  shapeConversationDetail,
  shapeChatResponse,
};
