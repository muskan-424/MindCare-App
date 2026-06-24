/**
 * tinkTools.js
 * The agentic "tools" Tink can run. Two kinds:
 *
 *  1. LOOKUPS — read real user data (mood, journals, goals, appointments,
 *     group sessions) and return a FACTS string + structured data + a trace.
 *     The composed reply is grounded ONLY in these facts (no invented data).
 *
 *  2. ACTION DRAFTS — turn free-text intent into a structured draft that the
 *     app renders as a review card. Nothing is written until the user confirms;
 *     on confirm the app POSTs the draft payload to the existing REST endpoint.
 *
 * All lookups are best-effort and never throw (degrade to an empty fact).
 */

const MoodEntry = require('../../wellness/models/MoodEntry');
const JournalEntry = require('../../wellness/models/JournalEntry');
const Goal = require('../../wellness/models/Goal');
const Appointment = require('../../therapy/models/Appointment');
const GroupSession = require('../models/GroupSession');

function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch (_) {
    return '';
  }
}

// ─────────────────────────── LOOKUPS ────────────────────────────────────────

async function lookupMood(userId) {
  try {
    const recent = await MoodEntry.find({ user: userId }).sort({ date: -1 }).limit(7).lean();
    if (!recent.length) {
      return { facts: 'The user has not logged any mood entries yet.', data: [], trace: { tool: 'lookupMood', count: 0 } };
    }
    const avg = (recent.reduce((s, m) => s + m.rating, 0) / recent.length).toFixed(1);
    const lines = recent.map(m => `${fmtDate(m.date)}: ${m.rating}/10${m.note ? ` (“${m.note}”)` : ''}`);
    return {
      facts: `The user's last ${recent.length} mood logs (most recent first): ${lines.join('; ')}. Recent average: ${avg}/10.`,
      data: recent.map(m => ({ date: m.date, rating: m.rating, note: m.note })),
      trace: { tool: 'lookupMood', count: recent.length },
    };
  } catch (e) {
    return { facts: '', data: [], trace: { tool: 'lookupMood', error: e.message } };
  }
}

async function lookupJournals(userId) {
  try {
    const recent = await JournalEntry.find({ user: userId }).sort({ date: -1 }).limit(3).lean();
    if (!recent.length) {
      return { facts: 'The user has not written any journal entries yet.', data: [], trace: { tool: 'lookupJournals', count: 0 } };
    }
    const lines = recent.map(j => {
      const snippet = (j.content || '').slice(0, 80);
      return `${fmtDate(j.date)} [${j.riskLevel || 'LOW'}]: “${snippet}${j.content && j.content.length > 80 ? '…' : ''}”`;
    });
    return {
      facts: `The user's most recent journal entries: ${lines.join(' | ')}.`,
      data: recent.map(j => ({ date: j.date, snippet: (j.content || '').slice(0, 120), riskLevel: j.riskLevel, emotionTags: j.emotionTags })),
      trace: { tool: 'lookupJournals', count: recent.length },
    };
  } catch (e) {
    return { facts: '', data: [], trace: { tool: 'lookupJournals', error: e.message } };
  }
}

async function lookupGoals(userId) {
  try {
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();
    if (!goals.length) {
      return { facts: 'The user has not set any goals yet.', data: [], trace: { tool: 'lookupGoals', count: 0 } };
    }
    const lines = goals.map(g => `“${g.title}” — ${g.progress || 0}% (${g.status})`);
    return {
      facts: `The user's goals: ${lines.join('; ')}.`,
      data: goals.map(g => ({ id: String(g._id), title: g.title, progress: g.progress, status: g.status, category: g.category })),
      trace: { tool: 'lookupGoals', count: goals.length },
    };
  } catch (e) {
    return { facts: '', data: [], trace: { tool: 'lookupGoals', error: e.message } };
  }
}

async function lookupAppointments(userId) {
  try {
    const appts = await Appointment.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean();
    if (!appts.length) {
      return { facts: 'The user has no therapy appointment requests.', data: [], trace: { tool: 'lookupAppointments', count: 0 } };
    }
    const lines = appts.map(a => {
      const when = a.date ? `${a.date} ${a.timeSlot || ''}`.trim() : (a.preferredTime || 'time TBD');
      return `${a.requestedSpeciality || 'Consultation'} — status: ${a.status}${when ? ` (${when})` : ''}`;
    });
    return {
      facts: `The user's appointment requests: ${lines.join('; ')}.`,
      data: appts.map(a => ({ id: String(a._id), speciality: a.requestedSpeciality, status: a.status, date: a.date, preferredTime: a.preferredTime })),
      trace: { tool: 'lookupAppointments', count: appts.length },
    };
  } catch (e) {
    return { facts: '', data: [], trace: { tool: 'lookupAppointments', error: e.message } };
  }
}

async function lookupGroupSessions() {
  try {
    const now = new Date();
    const sessions = await GroupSession.find({ scheduledDate: { $gte: now } })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .lean();
    if (!sessions.length) {
      return { facts: 'There are no upcoming group sessions available right now.', data: [], trace: { tool: 'lookupGroupSessions', count: 0 } };
    }
    const lines = sessions.map(s => {
      const spots = Array.isArray(s.participants) ? s.participants.length : 0;
      return `“${s.title}” on ${fmtDate(s.scheduledDate)} (${spots}/${s.maxParticipants || '?'} filled, led by ${s.facilitatorName || 'a facilitator'})`;
    });
    return {
      facts: `Upcoming group sessions: ${lines.join('; ')}.`,
      data: sessions.map(s => ({ id: String(s._id), title: s.title, scheduledDate: s.scheduledDate })),
      trace: { tool: 'lookupGroupSessions', count: sessions.length },
    };
  } catch (e) {
    return { facts: '', data: [], trace: { tool: 'lookupGroupSessions', error: e.message } };
  }
}

// ─────────────────────────── ACTION DRAFTS ──────────────────────────────────
// Each returns a draft the UI shows as a review card. `commit` tells the app
// exactly which existing endpoint + payload to POST when the user confirms.

const VALID_GOAL_CATEGORIES = ['mental_health', 'fitness', 'social', 'academic', 'self_care', 'sleep', 'other'];

function buildMoodDraft(entities = {}) {
  let rating = Number(entities.rating);
  if (!Number.isFinite(rating)) rating = 5;
  rating = Math.max(1, Math.min(10, Math.round(rating)));
  const note = (entities.note || '').toString().slice(0, 300);
  return {
    kind: 'mood',
    titleKey: 'draft_title_mood',
    title: 'Log your mood',
    fields: { rating, note },
    commit: { method: 'POST', endpoint: '/api/mood', payload: { rating, note } },
    summary: `Log mood ${rating}/10${note ? ` — “${note}”` : ''}`,
  };
}

function buildJournalDraft(entities = {}) {
  const content = (entities.content || entities.note || '').toString().slice(0, 4000);
  return {
    kind: 'journal',
    titleKey: 'draft_title_journal',
    title: 'New journal entry',
    fields: { content },
    commit: { method: 'POST', endpoint: '/api/journals', payload: { content } },
    summary: content ? `Save journal: “${content.slice(0, 80)}${content.length > 80 ? '…' : ''}”` : 'Save a new journal entry',
  };
}

function buildGoalDraft(entities = {}) {
  const title = (entities.title || entities.goal || '').toString().slice(0, 120);
  const description = (entities.description || '').toString().slice(0, 500);
  let category = (entities.category || 'mental_health').toString();
  if (!VALID_GOAL_CATEGORIES.includes(category)) category = 'mental_health';
  return {
    kind: 'goal',
    titleKey: 'draft_title_goal',
    title: 'New goal',
    fields: { title, description, category },
    commit: { method: 'POST', endpoint: '/api/goals', payload: { title, description, category } },
    summary: title ? `Create goal: “${title}”` : 'Create a new goal',
  };
}

function buildAppointmentDraft(entities = {}) {
  const requestedSpeciality = (entities.speciality || entities.requestedSpeciality || '').toString().slice(0, 100);
  const preferredTime = (entities.preferredTime || 'any').toString().slice(0, 50);
  const userNote = (entities.note || entities.userNote || '').toString().slice(0, 1000);
  return {
    kind: 'appointment',
    titleKey: 'draft_title_appointment',
    title: 'Request a therapy session',
    fields: { requestedSpeciality, preferredTime, userNote },
    commit: { method: 'POST', endpoint: '/api/appointments', payload: { requestedSpeciality, preferredTime, userNote } },
    summary: `Request${requestedSpeciality ? ` a ${requestedSpeciality}` : ' a therapy'} consultation${preferredTime && preferredTime !== 'any' ? ` (${preferredTime})` : ''}`,
  };
}

// Map a lookup intent → tool runner
const LOOKUP_TOOLS = {
  lookup_mood: (userId) => lookupMood(userId),
  lookup_journal: (userId) => lookupJournals(userId),
  lookup_goals: (userId) => lookupGoals(userId),
  lookup_appointments: (userId) => lookupAppointments(userId),
  discovery_groups: () => lookupGroupSessions(),
};

// Map an action intent → draft builder
const DRAFT_BUILDERS = {
  action_log_mood: buildMoodDraft,
  action_add_journal: buildJournalDraft,
  action_set_goal: buildGoalDraft,
  action_book_session: buildAppointmentDraft,
};

module.exports = {
  lookupMood,
  lookupJournals,
  lookupGoals,
  lookupAppointments,
  lookupGroupSessions,
  buildMoodDraft,
  buildJournalDraft,
  buildGoalDraft,
  buildAppointmentDraft,
  LOOKUP_TOOLS,
  DRAFT_BUILDERS,
};
