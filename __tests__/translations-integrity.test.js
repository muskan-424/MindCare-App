import translations from '../src/localization/translations';

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]]);
}

function placeholders(text) {
  return (String(text).match(/\{\w+\}/g) || []).sort().join(',');
}

// admin.* holds the web admin dashboard's strings, which are not yet cleaned up.
const isAppKey = key => !key.startsWith('admin.');

const english = Object.fromEntries(flatten(translations.en).filter(([key]) => isAppKey(key)));
const locales = Object.keys(translations).filter(lang => lang !== 'en');

// Danda (।॥) is shared punctuation across Indic scripts but lives in the Devanagari block.
const SCRIPTS = {
  Devanagari: /[ऀ-ॣ०-ॿ]/,
  Bengali: /[ঀ-৿]/,
  Gurmukhi: /[਀-੿]/,
  Gujarati: /[઀-૿]/,
  Tamil: /[஀-௿]/,
  Telugu: /[ఀ-౿]/,
  Kannada: /[ಀ-೿]/,
  Malayalam: /[ഀ-ൿ]/,
  Arabic: /[؀-ۿ]/,
  Han: /[一-鿿]/,
};
const NATIVE_SCRIPT = {
  hi: 'Devanagari', mr: 'Devanagari', pa: 'Gurmukhi', bn: 'Bengali', gu: 'Gujarati',
  ta: 'Tamil', te: 'Telugu', kn: 'Kannada', ml: 'Malayalam', ar: 'Arabic', zh: 'Han',
};

describe.each(locales)('%s translations', lang => {
  const entries = flatten(translations[lang]).filter(([key]) => isAppKey(key));
  const values = Object.fromEntries(entries);

  test('has every English key', () => {
    const missing = Object.keys(english).filter(key => typeof english[key] === 'string' && !(key in values));
    expect(missing).toEqual([]);
  });

  test('keeps the same placeholders as English', () => {
    const mismatched = entries
      .filter(([key, value]) => typeof value === 'string' && typeof english[key] === 'string')
      .filter(([key, value]) => placeholders(value) !== placeholders(english[key]))
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  if (NATIVE_SCRIPT[lang]) {
    test('contains no text in another language\'s script', () => {
      const foreign = entries
        .filter(([, value]) => typeof value === 'string')
        .filter(([, value]) => Object.entries(SCRIPTS)
          .some(([script, pattern]) => script !== NATIVE_SCRIPT[lang] && pattern.test(value)))
        .map(([key, value]) => `${key}: ${value}`);
      expect(foreign).toEqual([]);
    });
  }

  if (['fr', 'de', 'pt'].includes(lang)) {
    // French and German never use á/í/ó/ú or "-ción"; Portuguese does use the accents.
    const spanishMarkers = lang === 'pt' ? /[¿¡ñÑ]|ción/ : /[¿¡ñÑáíóúÁÍÓÚ]|ción/;
    test('contains no Spanish-only characters', () => {
      const spanish = entries
        .filter(([, value]) => typeof value === 'string' && spanishMarkers.test(value))
        .map(([key, value]) => `${key}: ${value}`);
      expect(spanish).toEqual([]);
    });
  }
});
