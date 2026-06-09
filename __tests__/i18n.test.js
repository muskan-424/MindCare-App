/**
 * i18n Unit Tests
 * Tests for the useTranslation hook, translations dictionary, and Redux language state management.
 * Uses react-test-renderer and the real Redux store.
 */

import React from 'react';
import renderer from 'react-test-renderer';
import { Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from '../src/redux/reducers';
import useTranslation from '../src/utils/i18n';
import translations from '../src/localization/translations';
import authReducer from '../src/redux/reducers/auth';
import { SET_LANGUAGE } from '../src/redux/actions/type';

/**
 * createLangStore — creates a real Redux store with a preset language.
 * The SET_LANGUAGE action is dispatched immediately after store creation.
 */
function createLangStore(lang) {
  const store = createStore(rootReducer, applyMiddleware(thunk));
  if (lang !== 'en') {
    store.dispatch({ type: SET_LANGUAGE, payload: lang });
  }
  return store;
}

// Helper component — renders the translated value as a Text node
const TranslationConsumer = ({ keyPath, fallback }) => {
  const { t, language } = useTranslation();
  return (
    <View>
      <Text testID="result">{t(keyPath, fallback)}</Text>
      <Text testID="lang">{language}</Text>
    </View>
  );
};

// Render component with Redux store for the given language
const renderWithStore = (lang, keyPath, fallback) => {
  const store = createLangStore(lang);
  let instance;
  renderer.act(() => {
    instance = renderer.create(
      <Provider store={store}>
        <TranslationConsumer keyPath={keyPath} fallback={fallback} />
      </Provider>
    );
  });
  return JSON.stringify(instance.toJSON());
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Translations dictionary structure
// ─────────────────────────────────────────────────────────────────────────────
describe('1. Translations dictionary structure', () => {
  const EXPECTED_LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es'];
  const EXPECTED_SECTIONS = ['language', 'home', 'mood', 'profile', 'peer', 'groups', 'common'];

  test('should contain all 11 supported languages', () => {
    EXPECTED_LANGS.forEach(lang => {
      expect(translations).toHaveProperty(lang);
    });
  });

  test('each language should have all required sections', () => {
    EXPECTED_LANGS.forEach(lang => {
      EXPECTED_SECTIONS.forEach(section => {
        expect(translations[lang]).toHaveProperty(section);
      });
    });
  });

  test('each language home section should have greeting keys', () => {
    EXPECTED_LANGS.forEach(lang => {
      expect(translations[lang].home).toHaveProperty('greeting_morning');
      expect(translations[lang].home).toHaveProperty('greeting_afternoon');
      expect(translations[lang].home).toHaveProperty('greeting_evening');
    });
  });

  test('each language mood section should have mood_labels 1-10', () => {
    EXPECTED_LANGS.forEach(lang => {
      for (let i = 1; i <= 10; i++) {
        expect(translations[lang].mood.mood_labels).toHaveProperty(String(i));
        expect(typeof translations[lang].mood.mood_labels[i]).toBe('string');
      }
    });
  });

  test('each language common section should have loading and cancel', () => {
    EXPECTED_LANGS.forEach(lang => {
      expect(translations[lang].common).toHaveProperty('loading');
      expect(translations[lang].common).toHaveProperty('cancel');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. useTranslation hook — English
// ─────────────────────────────────────────────────────────────────────────────
describe('2. useTranslation hook — English', () => {
  test('resolves greeting_morning key correctly', () => {
    const json = renderWithStore('en', 'home.greeting_morning');
    expect(json).toContain('Good Morning');
  });

  test('resolves mood.title key correctly', () => {
    const json = renderWithStore('en', 'mood.title');
    expect(json).toContain('Mood Check-in');
  });

  test('resolves mood_labels.5 key correctly', () => {
    const json = renderWithStore('en', 'mood.mood_labels.5');
    expect(json).toContain('Okay');
  });

  test('returns custom fallback for a missing key', () => {
    const json = renderWithStore('en', 'home.nonexistent_key', 'My Fallback');
    expect(json).toContain('My Fallback');
  });

  test('returns the key itself when no fallback and key is not found', () => {
    const json = renderWithStore('en', 'totally.missing.path');
    expect(json).toContain('totally.missing.path');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. useTranslation hook — Hindi
// ─────────────────────────────────────────────────────────────────────────────
describe('3. useTranslation hook — Hindi', () => {
  test('resolves greeting_morning in Hindi', () => {
    const json = renderWithStore('hi', 'home.greeting_morning');
    expect(json).toContain('सुप्रभात');
  });

  test('resolves mood.submit in Hindi', () => {
    const json = renderWithStore('hi', 'mood.submit');
    expect(json).toContain('मूड दर्ज करें');
  });

  test('resolves profile.language in Hindi', () => {
    const json = renderWithStore('hi', 'profile.language');
    expect(json).toContain('भाषा');
  });

  test('resolves groups.explore in Hindi', () => {
    const json = renderWithStore('hi', 'groups.explore');
    expect(json).toContain('सत्र खोजें');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. useTranslation hook — Punjabi
// ─────────────────────────────────────────────────────────────────────────────
describe('4. useTranslation hook — Punjabi', () => {
  test('resolves greeting_morning in Punjabi', () => {
    const json = renderWithStore('pa', 'home.greeting_morning');
    expect(json).toContain('ਸਤ ਸ੍ਰੀ ਅਕਾਲ');
  });

  test('resolves mood.title in Punjabi', () => {
    const json = renderWithStore('pa', 'mood.title');
    expect(json).toContain('ਮੂਡ ਚੈੱਕ-ਇਨ');
  });

  test('resolves language.select in Punjabi', () => {
    const json = renderWithStore('pa', 'language.select');
    expect(json).toContain('ਭਾਸ਼ਾ ਚੁਣੋ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. useTranslation hook — Marathi
// ─────────────────────────────────────────────────────────────────────────────
describe('5. useTranslation hook — Marathi', () => {
  test('resolves greeting_evening in Marathi', () => {
    const json = renderWithStore('mr', 'home.greeting_evening');
    expect(json).toContain('शुभ संध्या');
  });

  test('resolves peer.connect in Marathi', () => {
    const json = renderWithStore('mr', 'peer.connect');
    expect(json).toContain('जोडा');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. English fallback for missing keys in other languages
// ─────────────────────────────────────────────────────────────────────────────
describe('6. English fallback for missing keys', () => {
  test('falls back to English when a key is missing in Bengali', () => {
    const originalBnTitle = translations.bn.mood.title;
    delete translations.bn.mood.title;

    const json = renderWithStore('bn', 'mood.title');
    // Should fall back to English 'Mood Check-in'
    expect(json).toContain('Mood Check-in');

    // Restore
    translations.bn.mood.title = originalBnTitle;
  });

  test('falls back to explicit fallback string when key is not found in any language', () => {
    const json = renderWithStore('te', 'home.nonexistent', 'Custom Fallback');
    expect(json).toContain('Custom Fallback');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Redux — auth reducer SET_LANGUAGE action
// ─────────────────────────────────────────────────────────────────────────────
describe('7. Redux — auth reducer SET_LANGUAGE action', () => {
  test('initial language state is "en"', () => {
    const state = authReducer(undefined, {});
    expect(state.language).toBe('en');
  });

  test('SET_LANGUAGE action updates language to "hi"', () => {
    const state = authReducer(undefined, { type: SET_LANGUAGE, payload: 'hi' });
    expect(state.language).toBe('hi');
  });

  test('SET_LANGUAGE action updates language to "pa"', () => {
    const state = authReducer(undefined, { type: SET_LANGUAGE, payload: 'pa' });
    expect(state.language).toBe('pa');
  });

  test('SET_LANGUAGE action updates language to "mr"', () => {
    const state = authReducer(undefined, { type: SET_LANGUAGE, payload: 'mr' });
    expect(state.language).toBe('mr');
  });

  test('SET_LANGUAGE action updates language to "ta"', () => {
    const state = authReducer(undefined, { type: SET_LANGUAGE, payload: 'ta' });
    expect(state.language).toBe('ta');
  });

  test('SET_LANGUAGE action updates language to "es"', () => {
    const state = authReducer(undefined, { type: SET_LANGUAGE, payload: 'es' });
    expect(state.language).toBe('es');
  });

  test('LOGOUT action resets language back to "en"', () => {
    let state = authReducer(undefined, { type: SET_LANGUAGE, payload: 'hi' });
    expect(state.language).toBe('hi');
    state = authReducer(state, { type: 'LOGOUT' });
    expect(state.language).toBe('en');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Multi-language spot checks
// ─────────────────────────────────────────────────────────────────────────────
describe('8. Multi-language spot checks', () => {
  const spotChecks = [
    { lang: 'bn', key: 'mood.submit', expected: 'মুড লগ করুন' },
    { lang: 'te', key: 'groups.join', expected: 'నమోదు చేయండి' },
    { lang: 'ta', key: 'peer.title', expected: 'சகசார பொருத்தம்' },
    { lang: 'gu', key: 'profile.logout', expected: 'લૉગ આઉટ' },
    { lang: 'kn', key: 'common.cancel', expected: 'ರದ್ದುಮಾಡಿ' },
    { lang: 'ml', key: 'home.talk_to_tink', expected: 'Tink-നോട് സംസാരിക്കുക' },
    { lang: 'es', key: 'home.greeting_morning', expected: 'Buenos días' },
  ];

  spotChecks.forEach(({ lang, key, expected }) => {
    test(`${lang.toUpperCase()}: "${key}" → "${expected}"`, () => {
      const json = renderWithStore(lang, key);
      expect(json).toContain(expected);
    });
  });
});
