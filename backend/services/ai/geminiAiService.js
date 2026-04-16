const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const dotenv = require('dotenv');

dotenv.config();

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  maxOutputTokens: 1024,
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Calls Gemini for a structured AI assessment.
 * @param {string} systemPrompt - Instructions for the AI.
 * @param {string} userContent - The content to analyze.
 * @returns {Promise<Object>} - Parsed JSON response.
 */
async function callGeminiAssessment(systemPrompt, userContent) {
  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContent),
    ]);

    let text = response.content;

    // Handle potential markdown code blocks in Gemini response
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini Backend Service Error:', err.message);
    throw new Error('AI Assessment failed: ' + err.message);
  }
}

module.exports = { callGeminiAssessment };
