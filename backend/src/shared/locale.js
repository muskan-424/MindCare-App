/** Shared locale helpers for API-driven (dynamic) content localization. */

const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml',
  'es', 'fr', 'de', 'pt', 'ar', 'zh',
];

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  mr: 'Marathi',
  bn: 'Bengali',
  te: 'Telugu',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ar: 'Arabic',
  zh: 'Chinese (Simplified)',
};

function normalizeLanguage(code) {
  if (!code || typeof code !== 'string') return 'en';
  const base = code.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
}

/**
 * Resolve request language from query, body, or Accept-Language header.
 * @param {import('express').Request} req
 */
function getRequestLanguage(req) {
  const fromQuery = req?.query?.lang || req?.query?.language;
  if (fromQuery) return normalizeLanguage(String(fromQuery));

  const fromBody = req?.body?.language || req?.body?.lang;
  if (fromBody) return normalizeLanguage(String(fromBody));

  const header = req?.headers?.['accept-language'];
  if (header && typeof header === 'string') {
    const first = header.split(',')[0]?.trim();
    if (first) return normalizeLanguage(first);
  }

  return 'en';
}

function languageName(code) {
  return LANGUAGE_NAMES[normalizeLanguage(code)] || LANGUAGE_NAMES.en;
}

/** Prompt suffix for Gemini / LLM calls that should return user-facing text. */
function aiLanguageInstruction(language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en') {
    return 'Write all user-facing text fields in English.';
  }
  return `Write all user-facing text fields in ${languageName(lang)}. Keep JSON keys in English.`;
}

module.exports = {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  normalizeLanguage,
  getRequestLanguage,
  languageName,
  aiLanguageInstruction,
};
