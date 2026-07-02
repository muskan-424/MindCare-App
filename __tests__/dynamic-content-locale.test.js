/**
 * Dynamic content localization tests (backend locale helpers + fallbacks).
 */

const {
  normalizeLanguage,
  getRequestLanguage,
  aiLanguageInstruction,
  SUPPORTED_LANGUAGES,
} = require('../backend/src/shared/locale');

const {
  getIssueFallbackRecommendations,
  getFusionRecommendations,
} = require('../backend/src/shared/dynamicFallbacks');

describe('Dynamic content locale helpers', () => {
  test('normalizeLanguage accepts supported codes', () => {
    expect(normalizeLanguage('hi')).toBe('hi');
    expect(normalizeLanguage('hi-IN')).toBe('hi');
    expect(normalizeLanguage('xx')).toBe('en');
    expect(normalizeLanguage('')).toBe('en');
  });

  test('getRequestLanguage reads Accept-Language header', () => {
    const req = { headers: { 'accept-language': 'pa-IN,en;q=0.9' }, query: {}, body: {} };
    expect(getRequestLanguage(req)).toBe('pa');
  });

  test('getRequestLanguage prefers query over header', () => {
    const req = {
      headers: { 'accept-language': 'en' },
      query: { lang: 'mr' },
      body: {},
    };
    expect(getRequestLanguage(req)).toBe('mr');
  });

  test('aiLanguageInstruction includes target language name', () => {
    expect(aiLanguageInstruction('hi')).toContain('Hindi');
    expect(aiLanguageInstruction('en')).toContain('English');
  });

  test('all supported languages are normalized', () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(normalizeLanguage(lang)).toBe(lang);
    });
  });
});

describe('Dynamic content fallback recommendations', () => {
  test('issue fallbacks are localized for Hindi', () => {
    const recs = getIssueFallbackRecommendations('hi');
    expect(recs).toHaveLength(3);
    expect(recs[0]).not.toBe(getIssueFallbackRecommendations('en')[0]);
  });

  test('fusion fallbacks vary by risk level', () => {
    const low = getFusionRecommendations('LOW', 'en');
    const critical = getFusionRecommendations('CRITICAL', 'en');
    expect(low).not.toEqual(critical);
    expect(critical).toHaveLength(3);
  });

  test('fusion fallbacks use Hindi pack when available', () => {
    const hi = getFusionRecommendations('HIGH', 'hi');
    const en = getFusionRecommendations('HIGH', 'en');
    expect(hi).not.toEqual(en);
  });

  test('unknown language falls back to English recommendations', () => {
    expect(getFusionRecommendations('MEDIUM', 'es')).toEqual(getFusionRecommendations('MEDIUM', 'en'));
  });
});

describe('API wellness messages', () => {
  const { wellnessMessage } = require('../backend/src/shared/apiMessages');

  test('returns Hindi wellness request message', () => {
    expect(wellnessMessage('request_submitted', 'hi')).toContain('वेलनेस');
  });

  test('falls back to English for unknown language', () => {
    expect(wellnessMessage('request_submitted', 'xx')).toBe(wellnessMessage('request_submitted', 'en'));
  });
});

describe('Crisis helpline shape', () => {
  test('issue report safety helplines use translation keys', () => {
    const { shapeIssueReportCreated } = require('../backend/src/shared/responseShapers');
    const result = shapeIssueReportCreated({ _id: '1', recommendations: [] }, true);
    expect(result.safety.helplines[0]).toHaveProperty('nameKey');
    expect(result.safety.helplines[0].nameKey).toBe('crisis.vandrevala');
  });
});
