/**
 * geminiService.js
 * Calls the Gemini API directly from the frontend.
 */

// IMPORTANT: Never hardcode your API key and commit it to Git.
// Your previous key was flagged as leaked and disabled by Google.
// Please get a new key from https://aistudio.google.com/apikey 
// and set it in your local environment or prompt for it.
const GEMINI_API_KEY = 'PASTE_YOUR_NEW_API_KEY_HERE';
// Using gemini-2.0-flash as requested (v2.x series)
const MODEL = 'gemini-2.0-flash';
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
 * Gemini REQUIREMENT: The first message in the list must be from the 'user' role.
 * @param {Array<{text: string, isUser: boolean}>} history
 * @param {string} newMessage
 * @returns {Array}
 */
function buildContents(history, newMessage) {
  const contents = [];

  // Find the index of the first user message.
  // Gemini requires the conversation history to start with a 'user' turn.
  const firstUserIndex = history.findIndex(msg => msg.isUser);

  // If we found a user message, start from there.
  if (firstUserIndex !== -1) {
    const relevantHistory = history.slice(firstUserIndex);
    relevantHistory.forEach(msg => {
      if (msg.text && msg.text.trim()) {
        contents.push({
          role: msg.isUser ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    });
  }

  // Add the new user message
  contents.push({
    role: 'user',
    parts: [{ text: newMessage }],
  });

  return contents;
}

/**
 * Send a message to Gemini and get a reply.
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
    // Log the full error to help debugging
    console.error('Gemini API Error:', JSON.stringify(data, null, 2));
    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(errMsg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  return text.trim();
}
