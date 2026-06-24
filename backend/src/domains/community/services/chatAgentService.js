/**
 * chatAgentService.js
 * Shared agentic chat pipeline used by REST (POST /api/chat) and WebSocket.
 */
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Profile = require('../../identity/models/Profile');
const MoodEntry = require('../../wellness/models/MoodEntry');
const { config } = require('../../../../config/env');
const {
  generateTinkResponse,
  updateConversationSummary,
  detectCrisis,
  classifyIntent,
  composeGroundedReply,
  shouldGateConfidence,
  getVerificationNote,
  fallbackString,
} = require('./tinkChatService');
const rag = require('./tinkRagService');
const { LOOKUP_TOOLS, DRAFT_BUILDERS } = require('./tinkTools');
const audit = require('../../admin/services/auditService');
const { shapeChatResponse } = require('../../../shared/responseShapers');

const LOOKUP_INTENTS = ['lookup_mood', 'lookup_journal', 'lookup_goals', 'lookup_appointments'];
const ACTION_INTENTS = ['action_log_mood', 'action_add_journal', 'action_set_goal', 'action_book_session'];

async function loadUserContext(userId) {
  if (!userId) return null;
  const context = {};
  try {
    const profile = await Profile.findOne({ userId }).lean();
    if (profile) {
      context.name = profile.name;
      context.concerns = Array.isArray(profile.concerns) ? profile.concerns.slice(0, 8) : [];
    }
  } catch (_) { /* ignore */ }
  try {
    const lastMood = await MoodEntry.findOne({ user: userId }).sort({ date: -1 }).lean();
    if (lastMood) context.recentMood = lastMood.rating;
  } catch (_) { /* ignore */ }
  return Object.keys(context).length ? context : null;
}

function deriveTitle(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'New conversation';
  return clean.length > 48 ? `${clean.slice(0, 45)}...` : clean;
}

/**
 * Run the full agentic chat turn.
 * @param {Object} params
 * @param {string} params.message
 * @param {Array} [params.history]
 * @param {string} [params.conversationId]
 * @param {string} [params.language]
 * @param {string} [params.tone]
 * @param {string} [params.userId]
 * @param {import('express').Request} [params.req] optional — for audit correlation
 */
async function processAgenticChat({
  message,
  history = [],
  conversationId = null,
  language = 'en',
  tone,
  userId = null,
  req = null,
}) {
  const trimmed = String(message || '').trim();
  if (!trimmed) {
    const err = new Error('Message is required');
    err.status = 400;
    throw err;
  }

  const lang = language || 'en';

  let conversation = null;
  let priorSummary = '';
  let effectiveHistory = Array.isArray(history) ? history : [];
  if (userId && conversationId && mongoose.isValidObjectId(conversationId)) {
    conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    if (conversation) {
      priorSummary = conversation.summary || '';
      effectiveHistory = conversation.messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
    }
  }

  const userContext = await loadUserContext(userId);
  const crisisFlag = detectCrisis(trimmed);
  const classification = await classifyIntent({ message: trimmed, history: effectiveHistory });
  const intent = crisisFlag ? 'support' : classification.intent;
  const entities = classification.entities || {};

  if (crisisFlag) {
    audit.record({
      action: 'chat.crisis',
      actorId: userId || null,
      targetType: 'Conversation',
      targetId: conversationId,
    }, req);
  }

  let result;
  let sources = [];
  let draft = null;
  const toolTraces = [];
  let confidence = typeof classification.confidence === 'number' ? classification.confidence : 0.6;
  let mode = classification.mode || 'rule';
  let verificationNote;
  let modelTier;

  if (intent === 'support') {
    const r = await generateTinkResponse({
      message: trimmed, history: effectiveHistory, language: lang,
      summary: priorSummary, userContext,
    });
    result = r;
    modelTier = r.modelTier;
    confidence = crisisFlag ? 0.95 : Math.max(confidence, 0.7);
  } else {
    let facts = '';
    const needsAuth = LOOKUP_INTENTS.includes(intent) || ACTION_INTENTS.includes(intent);
    if (needsAuth && !userId) {
      result = {
        reply: fallbackString(lang, 'login_required'),
        suggestions: [], cards: [], crisis: false, mood: 'neutral', detectedLanguage: lang,
      };
      confidence = 0.9;
      mode = classification.mode;
    } else {
      if (intent === 'help') {
        sources = await rag.retrieve(trimmed, 3);
        toolTraces.push({ tool: 'rag', count: sources.length, hybrid: sources.some(s => s.source === 'pinecone') });
        confidence = sources.length ? Math.max(confidence, 0.75) : Math.min(confidence, 0.45);
      } else if (LOOKUP_TOOLS[intent]) {
        const toolResult = await LOOKUP_TOOLS[intent](userId);
        facts = toolResult.facts;
        toolTraces.push(toolResult.trace);
        confidence = toolResult.data && toolResult.data.length ? Math.max(confidence, 0.85) : Math.max(confidence, 0.6);
      } else if (DRAFT_BUILDERS[intent]) {
        draft = DRAFT_BUILDERS[intent](entities);
        toolTraces.push({ tool: 'draft', kind: draft.kind });
        confidence = Math.max(confidence, 0.7);
      }

      const gateLlm = shouldGateConfidence(confidence) && !crisisFlag;
      if (gateLlm) verificationNote = getVerificationNote(lang);

      const composed = await composeGroundedReply({
        intent, message: trimmed, facts, sources, language: lang,
        tone: tone || config.ai.defaultChatTone, userContext, draft,
        forceRule: gateLlm,
      });
      mode = gateLlm ? 'rule' : composed.mode;
      modelTier = composed.modelTier;
      result = {
        reply: composed.reply,
        suggestions: composed.suggestions,
        cards: [],
        crisis: false,
        mood: 'neutral',
        detectedLanguage: lang,
      };
    }
  }

  let savedConversationId = conversationId || null;
  if (userId) {
    try {
      if (!conversation) {
        conversation = new Conversation({ user: userId, language: lang, title: deriveTitle(trimmed), messages: [] });
      }
      conversation.language = lang;
      conversation.messages.push({ role: 'user', text: trimmed });
      conversation.messages.push({
        role: 'assistant', text: result.reply,
        suggestions: result.suggestions, cards: result.cards, crisis: result.crisis,
        detectedLanguage: result.detectedLanguage, intent, confidence,
        sources: sources.map(s => ({ id: s.id, title: s.title })), draft, mode,
        verificationNote, modelTier,
      });
      conversation.lastMessageAt = new Date();
      conversation.summary = await updateConversationSummary({
        previousSummary: priorSummary, userMessage: trimmed, assistantReply: result.reply,
      });
      await conversation.save();
      savedConversationId = conversation._id;
    } catch (persistErr) {
      // eslint-disable-next-line no-console
      console.warn('Chat persistence failed:', persistErr.message);
    }
  }

  return shapeChatResponse({
    reply: result.reply,
    suggestions: result.suggestions || [],
    cards: result.cards || [],
    crisis: result.crisis || false,
    mood: result.mood || 'neutral',
    detectedLanguage: result.detectedLanguage || lang,
    intent,
    confidence: Math.round(confidence * 100) / 100,
    sources: sources.map(s => ({ id: s.id, title: s.title, snippet: s.snippet })),
    draft,
    mode,
    toolTraces,
    conversationId: savedConversationId,
    verificationNote,
    modelTier,
  });
}

module.exports = { processAgenticChat, loadUserContext, deriveTitle };
