const mongoose = require('mongoose');

/**
 * A single message inside a Tink conversation.
 * role: 'user' | 'assistant' | 'system'
 */
const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    // Optional metadata attached to assistant turns
    suggestions: { type: [String], default: undefined },
    cards: { type: Array, default: undefined },
    crisis: { type: Boolean, default: undefined },
    detectedLanguage: { type: String, default: undefined },
    // Agentic metadata
    intent: { type: String, default: undefined },
    confidence: { type: Number, default: undefined },
    sources: { type: Array, default: undefined },
    draft: { type: mongoose.Schema.Types.Mixed, default: undefined },
    mode: { type: String, default: undefined }, // 'gemini' | 'rule'
    verificationNote: { type: String, default: undefined },
    modelTier: { type: String, default: undefined }, // 'fast' | 'quality' | 'rule'
  },
  { timestamps: true, _id: true }
);

/**
 * Conversation — a persisted thread between a user and Tink.
 * Stores the full message history plus a rolling `summary` that
 * acts as long-term memory so Tink can recall context across sessions
 * without resending the entire transcript to the LLM.
 */
const ConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New conversation',
    },
    language: {
      type: String,
      default: 'en',
    },
    // Rolling memory: a short, continuously-updated summary of the
    // emotional themes and facts shared so far.
    summary: {
      type: String,
      default: '',
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ user: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
