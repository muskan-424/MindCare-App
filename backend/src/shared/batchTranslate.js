const { translateText } = require('../domains/community/services/tinkChatService');
const { normalizeLanguage, languageName } = require('./locale');

/**
 * Translate an array of strings in one Gemini call (falls back to per-string translate).
 * @param {string[]} strings
 * @param {string} targetLanguage
 * @returns {Promise<string[]>}
 */
async function batchTranslateStrings(strings, targetLanguage) {
  const items = (strings || []).map((s) => String(s || ''));
  const lang = normalizeLanguage(targetLanguage);
  if (lang === 'en' || items.length === 0) return items;

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'missing_api_key_placeholder' || process.env.USE_MOCK_CHATBOT === 'true') {
    return Promise.all(items.map((text) => translateText({ text, targetLanguage: lang })));
  }

  try {
    const prompt = `Translate each string in this JSON array into ${languageName(lang)}. Preserve tone. Return ONLY a JSON array of translated strings in the same order, no markdown.\n\n${JSON.stringify(items)}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length === items.length) {
        return parsed.map((v, i) => (typeof v === 'string' && v.trim() ? v.trim() : items[i]));
      }
    }
  } catch (err) {
    console.warn('Batch translate failed, falling back:', err.message);
  }

  return Promise.all(items.map((text) => translateText({ text, targetLanguage: lang })));
}

module.exports = { batchTranslateStrings };
