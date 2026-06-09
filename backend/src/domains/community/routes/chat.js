const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const Profile = require('../../identity/models/Profile');
const { config } = require('../../../../config/env');
const MoodEntry = require('../../wellness/models/MoodEntry');
const {
  generateTinkResponse,
  updateConversationSummary,
  detectCrisis,
  classifyIntent,
  composeGroundedReply,
  refineReply,
  translateText,
  getCapabilities,
  shouldGateConfidence,
  VERIFICATION_NOTE,
} = require('../services/tinkChatService');
const rag = require('../services/tinkRagService');
const { LOOKUP_TOOLS, DRAFT_BUILDERS } = require('../services/tinkTools');
const audit = require('../../admin/services/auditService');
const {
  shapeChatResponse,
  shapeConversationSummary,
  shapeConversationDetail,
} = require('../../../shared/responseShapers');

/**
 * optionalAuth — decode a JWT if present, but never block the request.
 * Authenticated users get persistence, memory, and data-driven tools.
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded.user;
    } catch (_) { /* anonymous */ }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

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

const LOOKUP_INTENTS = ['lookup_mood', 'lookup_journal', 'lookup_goals', 'lookup_appointments'];
const ACTION_INTENTS = ['action_log_mood', 'action_add_journal', 'action_set_goal', 'action_book_session'];

// ── POST /api/chat ───────────────────────────────────────────────────────────
// Agentic chat: classify → run tools / RAG → compose grounded reply → persist.
// Body: { message, history?, conversationId?, language?, tone? }
router.post('/', optionalAuth, async (req, res) => {
  const { message, history, conversationId, language, tone } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ errors: [{ msg: 'Message is required' }] });
  }

  const lang = (typeof language === 'string' && language) ? language : 'en';
  const userId = req.user && req.user.id;
  const trimmed = String(message).trim();

  try {
    // 1. Load conversation context (authenticated users)
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

    // 2. Classify intent (crisis always routes to the empathetic path)
    const crisisFlag = detectCrisis(trimmed);
    let classification = await classifyIntent({ message: trimmed, history: effectiveHistory });
    let intent = crisisFlag ? 'support' : classification.intent;
    const entities = classification.entities || {};

    // Crisis signals are safety-critical — record them in the audit trail.
    if (crisisFlag) {
      audit.record({ action: 'chat.crisis', actorId: userId || null, targetType: 'Conversation', targetId: conversationId }, req);
    }

    // 3. Run tools / RAG and compose the reply
    let result; // { reply, suggestions, cards, crisis, mood, detectedLanguage }
    let sources = [];
    let draft = null;
    let toolTraces = [];
    let confidence = typeof classification.confidence === 'number' ? classification.confidence : 0.6;
    let mode = classification.mode || 'rule';
    let verificationNote;
    let modelTier;

    if (intent === 'support') {
      // Empathetic conversation (handles crisis warmly + crisis card)
      const r = await generateTinkResponse({
        message: trimmed, history: effectiveHistory, language: lang,
        summary: priorSummary, userContext,
      });
      result = r;
      modelTier = r.modelTier;
      confidence = crisisFlag ? 0.95 : Math.max(confidence, 0.7);
    } else {
      let facts = '';
      // Lookups / actions need a logged-in user
      const needsAuth = LOOKUP_INTENTS.includes(intent) || ACTION_INTENTS.includes(intent);
      if (needsAuth && !userId) {
        result = {
          reply: "I'd love to help with that, but I can't access your personal info until you're logged in. Please log in and ask me again.",
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
        if (gateLlm) verificationNote = VERIFICATION_NOTE;

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

    // 4. Persist (authenticated users)
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
        console.warn('Chat persistence failed:', persistErr.message);
      }
    }

    return res.json(shapeChatResponse({
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
    }));
  } catch (err) {
    console.error('Chat error:', err.message);
    return res.json(shapeChatResponse({
      reply: "I'm so sorry, my mind went quiet for a second there. I'm still here with you — could you say that again?",
      suggestions: [], cards: [], crisis: false, intent: 'support', confidence: 0,
      sources: [], draft: null, mode: 'rule', toolTraces: [], conversationId: conversationId || null,
    }));
  }
});

// ── POST /api/chat/refine ────────────────────────────────────────────────────
// Rewrite text in a style: shorter | professional | simpler | steps
router.post('/refine', optionalAuth, async (req, res) => {
  const { text, mode, language } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'Text is required' });
  try {
    const refined = await refineReply({ text: String(text), mode: mode || 'shorter', language: language || 'en' });
    res.json({ text: refined });
  } catch (err) {
    console.error('Refine error:', err.message);
    res.json({ text: String(text) });
  }
});

// ── POST /api/chat/translate ─────────────────────────────────────────────────
router.post('/translate', optionalAuth, async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'Text is required' });
  try {
    const translated = await translateText({ text: String(text), targetLanguage: targetLanguage || 'en' });
    res.json({ text: translated });
  } catch (err) {
    console.error('Translate error:', err.message);
    res.json({ text: String(text) });
  }
});

// ── POST /api/chat/classify ──────────────────────────────────────────────────
router.post('/classify', optionalAuth, async (req, res) => {
  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const classification = await classifyIntent({ message: String(message), history: Array.isArray(history) ? history : [] });
    res.json(classification);
  } catch (err) {
    console.error('Classify error:', err.message);
    res.status(500).json({ error: 'Classification failed' });
  }
});

// ── GET /api/chat/capabilities ───────────────────────────────────────────────
router.get('/capabilities', (_req, res) => {
  res.json(getCapabilities());
});

// ── GET /api/chat/conversations ──────────────────────────────────────────────
router.get('/conversations', optionalAuth, requireAuth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id })
      .sort({ lastMessageAt: -1 }).limit(50)
      .select('title language lastMessageAt createdAt messages').lean();
    res.json(conversations.map(shapeConversationSummary));
  } catch (err) {
    console.error('List conversations error:', err.message);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// ── GET /api/chat/conversations/:id ──────────────────────────────────────────
router.get('/conversations/:id', optionalAuth, requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation id' });
    const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(shapeConversationDetail(conversation));
  } catch (err) {
    console.error('Get conversation error:', err.message);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// ── DELETE /api/chat/conversations/:id ───────────────────────────────────────
router.delete('/conversations/:id', optionalAuth, requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation id' });
    const deleted = await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete conversation error:', err.message);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
