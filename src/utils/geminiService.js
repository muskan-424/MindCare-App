/**
 * geminiService.js
 * Calls the Gemini 2.5 Flash REST API directly from the frontend.
 * No backend / Render dependency for chat.
 */

const GEMINI_API_KEY = '***REMOVED***';
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are "Tink", an empathetic, supportive, and knowledgeable AI mental health assistant for the MindCare app.
Your goal is to provide emotional support, listen to the user, and answer questions about mental health.

INSTRUCTIONS:
1. Always be compassionate, validating, and non-judgmental.
2. Keep responses concise and warm — this is a mobile chat interface.
3. You are NOT a licensed medical professional. If a user mentions self-harm or crisis, gently encourage them to seek professional help or a trusted person.
4. If you don't know something, say so honestly.`;

/**
 * Convert frontend message history to Gemini's "contents" format.
 * @param {Array<{text: string, isUser: boolean}>} history
 * @returns {Array}
 */
function buildContents(history, newMessage) {
  const contents = [];

  // Add history (skip the very first bot greeting to avoid empty turns)
  history.forEach(msg => {
    if (msg.text && msg.text.trim()) {
      contents.push({
        role: msg.isUser ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }
  });

  // Add the new user message
  contents.push({
    role: 'user',
    parts: [{ text: newMessage }],
  });

  return contents;
}

/**
 * Send a message to Gemini and get a reply.
 * @param {string} message - the user's new message
 * @param {Array} history - previous messages [{text, isUser}]
 * @returns {Promise<string>} - Tink's reply
 */
export async function sendMessageToGemini(message, history = []) {
  const contents = buildContents(history, message);

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return text.trim();
}
