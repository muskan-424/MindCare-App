const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const { config } = require('../../../../config/env');
const {
  refineReply,
  translateText,
  getCapabilities,
  classifyIntent,
} = require('../services/tinkChatService');
const { processAgenticChat } = require('../services/chatAgentService');
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

  try {
    const response = await processAgenticChat({
      message, history, conversationId, language: lang, tone, userId, req,
    });
    return res.json(response);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ errors: [{ msg: err.message }] });
    }
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
