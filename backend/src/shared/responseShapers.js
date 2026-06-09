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

function formatJournalDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatJournalTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function shapeMoodLogResponse(entry, streakData = {}) {
  const plain = shapeId(entry);
  return {
    id: plain.id || String(plain._id),
    date: plain.date,
    rating: plain.rating,
    streak: streakData.currentStreak ?? 0,
    newBadge: streakData.newBadge ?? null,
  };
}

function shapeMoodEntryBrief(entry) {
  if (!entry) return null;
  return {
    id: entry._id ? String(entry._id) : entry.id,
    date: entry.date,
    rating: entry.rating,
    note: entry.note || '',
  };
}

function shapeMoodToday(entry) {
  return {
    loggedToday: Boolean(entry),
    entry: shapeMoodEntryBrief(entry),
  };
}

function shapeJournalEntry(entry) {
  const plain = shapeId(entry);
  const date = plain.date || new Date();
  return {
    id: plain.id || String(plain._id),
    date: formatJournalDate(date),
    time: formatJournalTime(date),
    content: plain.content,
    sentimentScore: plain.sentimentScore,
    emotionTags: plain.emotionTags,
    riskLevel: plain.riskLevel,
    aiInsight: plain.aiInsight,
  };
}

function shapeJournalEntries(entries) {
  return (entries || []).map(shapeJournalEntry);
}

function shapeTherapistListing(t) {
  return {
    id: t.id || (t._id ? String(t._id) : undefined),
    name: t.name,
    specialisation: t.specialisation || 'Mental Health Professional',
    img: t.img || 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png',
    bio: t.bio || '',
    email: t.email || '',
    contact_no: t.contact_no || '',
    timing: t.timing || '9:00 AM - 5:00 PM',
    fee: t.fee || '$15/session',
    stars: t.stars ?? 5,
  };
}

function shapeTherapistProfile(t) {
  const plain = shapeId(t);
  return shapeTherapistListing({
    ...plain,
    id: plain.id || String(plain._id),
    bio: plain.bio || 'Your bio here',
    contact_no: plain.contact_no || '12345678',
    fee: plain.fee || '$50/session',
  });
}

function shapeTherapistNote(note) {
  const plain = shapeId(note);
  return {
    id: plain.id || String(plain._id),
    patient: plain.patient ? String(plain.patient) : undefined,
    therapist: plain.therapist ? String(plain.therapist) : undefined,
    sessionDate: plain.sessionDate,
    content: plain.content,
    category: plain.category,
    confidentialityLevel: plain.confidentialityLevel,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function shapeTherapistNotes(notes) {
  return (notes || []).map(shapeTherapistNote);
}

function shapeClinicalPatientProfile({ user, profile, fusions, issues, moods, journals }) {
  return {
    user: shapeUser(user),
    profile: shapeProfile(profile),
    fusions: (fusions || []).map(f => ({
      id: String(f._id),
      riskLevel: f.riskLevel,
      riskScore: f.riskScore,
      aiMarkers: f.aiMarkers,
      recommendations: f.recommendations,
      createdAt: f.createdAt,
    })),
    issues: (issues || []).map(i => ({
      id: String(i._id),
      category: i.category,
      severity: i.severity,
      riskLevel: i.riskLevel,
      safetyTriggered: i.safetyTriggered,
      createdAt: i.createdAt,
    })),
    moods: (moods || []).map(shapeMoodEntryBrief),
    journals: (journals || []).map(j => ({
      id: String(j._id),
      title: j.title,
      contentPreview: j.content ? `${j.content.substring(0, 50)}...` : '',
      date: j.date,
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
  shapeMoodLogResponse,
  shapeMoodEntryBrief,
  shapeMoodToday,
  shapeJournalEntry,
  shapeJournalEntries,
  shapeTherapistListing,
  shapeTherapistProfile,
  shapeTherapistNote,
  shapeTherapistNotes,
  shapeClinicalPatientProfile,
  shapeConversationSummary,
  shapeConversationDetail,
  shapeChatResponse,
};
