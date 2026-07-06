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

  test('Spanish fusion fallbacks are localized', () => {
    const es = getFusionRecommendations('MEDIUM', 'es');
    const en = getFusionRecommendations('MEDIUM', 'en');
    expect(es).not.toEqual(en);
  });

  test('unknown language falls back to English recommendations', () => {
    expect(getFusionRecommendations('MEDIUM', 'xx')).toEqual(getFusionRecommendations('MEDIUM', 'en'));
  });

  test('Bengali issue fallbacks are localized', () => {
    const bn = getIssueFallbackRecommendations('bn');
    const en = getIssueFallbackRecommendations('en');
    expect(bn).not.toEqual(en);
  });
});

describe('YouTube search query localization', () => {
  const { getYoutubeSearchQuery } = require('../backend/src/shared/youtubeSearchQueries');

  test('returns localized meditation query for Hindi', () => {
    const hi = getYoutubeSearchQuery('meditation', 'hi');
    const en = getYoutubeSearchQuery('meditation', 'en');
    expect(hi).not.toBe(en);
    expect(hi).toContain('hindi');
  });

  test('falls back to English for unknown language', () => {
    expect(getYoutubeSearchQuery('sleep', 'xx')).toBe(getYoutubeSearchQuery('sleep', 'en'));
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

describe('Burnout alert shape', () => {
  test('includes description and message fields', () => {
    const { shapeBurnoutAlertResponse } = require('../backend/src/shared/responseShapers');
    const result = shapeBurnoutAlertResponse({
      _id: '1',
      category: 'burnout_alert',
      riskLevel: 'HIGH',
      description: 'High burnout risk detected.',
      recommendations: ['Take rest immediately.'],
    });
    expect(result.active).toBe(true);
    expect(result.alert.description).toBe('High burnout risk detected.');
    expect(result.alert.message).toBe('Take rest immediately.');
  });
});

describe('Fitness content shape', () => {
  test('fitness name map includes label field', () => {
    const { shapeFitnessNameMap } = require('../backend/src/shared/responseShapers');
    const map = shapeFitnessNameMap([{ name: 'Yoga', icon: 'icon.png' }]);
    expect(map.Yoga.label).toBe('Yoga');
  });

  test('fitness content map includes imageUrl and label', () => {
    const { shapeFitnessContentMap } = require('../backend/src/shared/responseShapers');
    const map = shapeFitnessContentMap([{ title: 'Morning Yoga', imageUrl: 'img.jpg', videoId: 'abc' }]);
    expect(map['Morning Yoga'].imageUrl).toBe('img.jpg');
    expect(map['Morning Yoga'].label).toBe('Morning Yoga');
  });

  test('fitness label fallback localizes Yoga in Hindi without API', () => {
    const { getFitnessLabelFallback } = require('../backend/src/shared/fitnessFallbacks');
    expect(getFitnessLabelFallback('Yoga', 'hi')).toBe('योग');
    expect(getFitnessLabelFallback('Yoga', 'gu')).toBe('યોગ');
    expect(getFitnessLabelFallback('Yoga', 'en')).toBe('Yoga');
  });
});

describe('Emergency API messages', () => {
  const { emergencyMessage } = require('../backend/src/shared/apiMessages');

  test('returns Hindi emergency submitted message', () => {
    expect(emergencyMessage('submitted', 'hi')).toContain('आपातकालीन');
  });
});

describe('Profile language preference', () => {
  test('normalizeLanguage accepts all supported profile codes', () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(normalizeLanguage(lang)).toBe(lang);
    });
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
