/**
 * Simple test: check if GOOGLE_API_KEY / GEMINI_API_KEY works with Gemini.
 * Run from project root: node backend/scripts/test-chat-api.js
 * Or from backend/: node scripts/test-chat-api.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

async function testWithRestApi() {
  // Test 1: Direct REST API (no LangChain) – proves key and model work
  const modelsToTry = ['gemini-2.5-flash'];
  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: OK' }] }],
        generationConfig: { maxOutputTokens: 50 },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        ok: true,
        model,
        text: data.candidates[0].content.parts[0].text.trim(),
      };
    }
    if (res.status === 404 || (data.error?.message || '').includes('404')) continue;
    return { ok: false, model, status: res.status, error: data.error?.message || res.statusText };
  }
  return { ok: false, error: 'All models failed (404 or other)' };
}

async function main() {
  console.log('--- MindCare Chat API Key Test ---\n');

  if (!apiKey || apiKey === 'missing_api_key_placeholder') {
    console.log('FAIL: No API key found.');
    console.log('Set GOOGLE_API_KEY or GEMINI_API_KEY in backend/.env');
    process.exit(1);
  }

  const masked = apiKey.length > 12 ? apiKey.slice(0, 8) + '...' + apiKey.slice(-4) : '***';
  console.log('Using API key:', masked);

  console.log('\n[1] Testing with direct Gemini REST API...');
  const restResult = await testWithRestApi();

  if (restResult.ok) {
    console.log('SUCCESS – API key and model work.');
    console.log('Model:', restResult.model);
    console.log('Response:', restResult.text);
    console.log('\nYour chatbot should work. If the app still says "brain offline",');
    console.log('check that the app is calling the same backend where this .env is used');
    console.log('(e.g. backend running locally or Render with this key set).');
    process.exit(0);
  }

  console.log('FAIL – Direct API error:', restResult.status || '', restResult.error || '');
  if (restResult.status === 403 || (restResult.error || '').toLowerCase().includes('api key not valid')) {
    console.log('\nTip: API key is invalid or restricted. Get a key at https://aistudio.google.com/apikey');
    console.log('     and ensure the key is not restricted to specific APIs (or allow Generative Language API).');
  } else if (restResult.status === 429 || (restResult.error || '').toLowerCase().includes('quota')) {
    console.log('\nTip: Quota or rate limit exceeded. Free tier may have limit 0 or be exhausted.');
    console.log('     Check https://ai.google.dev/gemini-api/docs/rate-limits or enable billing in Google Cloud.');
  } else if (restResult.status === 404 || (restResult.error || '').includes('404')) {
    console.log('\nTip: Model name may have changed. Check https://ai.google.dev/gemini-api/docs/models');
  }
  process.exit(1);
}

main();
