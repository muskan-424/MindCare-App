/**
 * geminiService.js
 * Calls the Gemini API directly from the frontend.
 */

import { GOOGLE_API_KEY } from '@env';
const GEMINI_API_KEY = (GOOGLE_API_KEY || '').replace(/^"|"$|^'|'$/g, '');
// Using gemini-flash-latest to avoid 503 high demand errors gracefully
const MODEL = 'gemini-flash-latest';
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
 * Helper to pause execution for a given number of milliseconds
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send a message to Gemini and get a reply (with automatic retries).
 */
export async function sendMessageToGemini(message, history = [], retries = 2) {
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // If it's a 503 or 429 and we still have retries left, delay and try again
        if ((response.status === 503 || response.status === 429) && attempt < retries) {
          console.warn(`Gemini API busy (Status ${response.status}). Retrying in 2 seconds... (Attempt ${attempt + 1}/${retries})`);
          await delay(2000 * (attempt + 1)); // Exponential backoff spacing
          continue;
        }

        // Log the full error to help debugging if all retries fail
        console.error('Gemini API Error:', JSON.stringify(data, null, 2));
        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        throw new Error(errMsg);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');

      return text.trim();
      
    } catch (err) {
      if (attempt === retries) {
        throw err; // Re-throw the error on the final attempt
      }
    }
  }
}
