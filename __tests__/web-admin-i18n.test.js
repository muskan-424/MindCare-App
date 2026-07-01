/**
 * Web admin dashboard i18n tests.
 * Validates web.* translation keys, admin/src key references, and the admin t() resolver.
 */

import fs from 'fs';
import path from 'path';
import translations from '../src/localization/translations';

const EXPECTED_LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const ADMIN_ACTION_VALUES = ['none', 'contacted', 'referred', 'resolved'];
const ACTION_LABEL_KEYS = {
  none: 'web.action_reviewed',
  contacted: 'web.action_contacted_user',
  referred: 'web.action_referred_care',
  resolved: 'web.action_resolved',
};

/** Mirrors admin/src/i18n.jsx resolve + t() for unit tests without React DOM. */
function resolveKey(keyPath, obj) {
  if (!keyPath || !obj) return undefined;
  return keyPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function adminTranslate(language, key, paramsOrFallback, explicitFallback) {
  let params = null;
  let fallback = explicitFallback;
  if (paramsOrFallback != null) {
    if (typeof paramsOrFallback === 'string') fallback = paramsOrFallback;
    else if (typeof paramsOrFallback === 'object') params = paramsOrFallback;
  }
  const langDict = translations[language] || translations.en;
  const raw = resolveKey(key, langDict) ?? resolveKey(key, translations.en);
  if (raw != null && typeof raw === 'string') {
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name) => {
      const val = params[name];
      return val != null ? String(val) : `{${name}}`;
    });
  }
  return fallback !== undefined ? fallback : key;
}

function lookupTranslation(lang, keyPath) {
  return resolveKey(keyPath, translations[lang]) ?? resolveKey(keyPath, translations.en);
}

function collectAdminTranslationKeys() {
  const adminSrc = path.join(__dirname, '../admin/src');
  const keys = new Set();

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(jsx|js)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const match of content.matchAll(/t\(['"]((?:web|admin|common)\.[^'"]+)['"]/g)) {
          keys.add(match[1]);
        }
      }
    }
  }

  walk(adminSrc);
  return [...keys].sort();
}

const INTERPOLATION_KEYS = {
  'web.users_sidebar': ['count'],
  'web.status_verified': ['action'],
  'web.broadcast_sent': ['count'],
  'web.appt_requested': ['speciality'],
  'web.appt_pref': ['speciality', 'dates', 'time'],
  'web.clinical_ai_intake': ['count'],
  'web.clinical_risk_reports': ['count'],
  'web.clinical_recent_moods': ['count'],
  'web.clinical_journals': ['count'],
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dictionary structure
// ─────────────────────────────────────────────────────────────────────────────
describe('1. Web admin dictionary structure', () => {
  test('web section exists in all 16 languages', () => {
    EXPECTED_LANGS.forEach((lang) => {
      expect(translations[lang]).toHaveProperty('web');
      expect(typeof translations[lang].web).toBe('object');
    });
  });

  test('each language web section contains all English keys', () => {
    const enKeys = Object.keys(translations.en.web);
    EXPECTED_LANGS.forEach((lang) => {
      enKeys.forEach((key) => {
        expect(translations[lang].web).toHaveProperty(key);
      });
    });
  });

  test('English web section has at least 120 keys', () => {
    expect(Object.keys(translations.en.web).length).toBeGreaterThanOrEqual(120);
  });

  test('every web value is a non-empty string in all languages', () => {
    EXPECTED_LANGS.forEach((lang) => {
      Object.entries(translations[lang].web).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Keys referenced in admin/src
// ─────────────────────────────────────────────────────────────────────────────
describe('2. Keys referenced in admin/src', () => {
  const referencedKeys = collectAdminTranslationKeys();

  test('admin/src references translation keys', () => {
    expect(referencedKeys.length).toBeGreaterThan(50);
  });

  test.each(referencedKeys)('"%s" resolves in English', (keyPath) => {
    const value = lookupTranslation('en', keyPath);
    expect(typeof value).toBe('string');
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test.each(referencedKeys)('"%s" resolves in all 16 languages', (keyPath) => {
    EXPECTED_LANGS.forEach((lang) => {
      const value = lookupTranslation(lang, keyPath);
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Interpolation placeholders
// ─────────────────────────────────────────────────────────────────────────────
describe('3. Web admin interpolation placeholders', () => {
  Object.entries(INTERPOLATION_KEYS).forEach(([keyPath, placeholders]) => {
    test(`${keyPath} contains required placeholders`, () => {
      const template = lookupTranslation('en', keyPath);
      placeholders.forEach((name) => {
        expect(template).toContain(`{${name}}`);
      });
    });
  });

  test('users_sidebar replaces {count}', () => {
    expect(adminTranslate('en', 'web.users_sidebar', { count: 42 })).toBe('Users (42)');
  });

  test('broadcast_sent replaces {count}', () => {
    expect(adminTranslate('en', 'web.broadcast_sent', { count: 15 })).toBe('Sent to 15 recipients.');
  });

  test('appt_requested replaces {speciality}', () => {
    expect(adminTranslate('en', 'web.appt_requested', { speciality: 'CBT' })).toBe('requested CBT');
  });

  test('clinical_ai_intake replaces {count}', () => {
    expect(adminTranslate('en', 'web.clinical_ai_intake', { count: 3 })).toBe('AI intake (3)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Admin translate helper (mirrors I18nProvider)
// ─────────────────────────────────────────────────────────────────────────────
describe('4. Admin translate helper', () => {
  test('resolves web.header_title in English', () => {
    expect(adminTranslate('en', 'web.header_title')).toBe('MindCare Admin');
  });

  test('resolves web.tab_pending in Hindi', () => {
    expect(adminTranslate('hi', 'web.tab_pending')).toBe('लंबित समीक्षा');
  });

  test('returns explicit fallback for missing key', () => {
    expect(adminTranslate('en', 'web.modal_select', 'Select…')).toBe('Select…');
  });

  test('returns key path when missing and no fallback', () => {
    expect(adminTranslate('en', 'web.totally_missing_key')).toBe('web.totally_missing_key');
  });

  test('falls back to English when key missing in target language', () => {
    const original = translations.bn.web.header_title;
    delete translations.bn.web.header_title;
    expect(adminTranslate('bn', 'web.header_title')).toBe('MindCare Admin');
    translations.bn.web.header_title = original;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. VerifyModal action labels
// ─────────────────────────────────────────────────────────────────────────────
describe('5. VerifyModal action label keys', () => {
  test('every ADMIN_ACTION value has a web.action_* translation key', () => {
    ADMIN_ACTION_VALUES.forEach((value) => {
      expect(ACTION_LABEL_KEYS).toHaveProperty(value);
      const keyPath = ACTION_LABEL_KEYS[value];
      expect(keyPath.startsWith('web.action_')).toBe(true);
      expect(typeof lookupTranslation('en', keyPath)).toBe('string');
    });
  });

  test('action labels resolve in Hindi', () => {
    expect(adminTranslate('hi', 'web.action_contacted_user')).toBeTruthy();
    expect(adminTranslate('hi', 'web.action_resolved')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Component-critical keys
// ─────────────────────────────────────────────────────────────────────────────
describe('6. Component-critical web keys', () => {
  const criticalKeys = [
    'web.pending_risk_title',
    'web.appt_assign',
    'web.modal_verify_report',
    'web.broadcast_send',
    'web.analytics_loading',
    'web.stat_total_users',
    'web.clinical_untitled',
    'admin.new_broadcast',
    'admin.no_slots',
    'admin.no_risk_data',
    'admin.no_mood_data',
    'common.cancel',
  ];

  test.each(criticalKeys)('"%s" is defined in English', (keyPath) => {
    expect(lookupTranslation('en', keyPath)).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Hindi web overrides
// ─────────────────────────────────────────────────────────────────────────────
describe('7. Hindi web admin overrides', () => {
  test('header_title is localized in Hindi', () => {
    expect(translations.hi.web.header_title).toBe('MindCare एडमिन');
  });

  test('save_load is localized in Hindi', () => {
    expect(translations.hi.web.save_load).toBe('सहेजें और लोड करें');
  });

  test('verify_btn is localized in Hindi', () => {
    expect(translations.hi.web.verify_btn).toBe('सत्यापित करें');
  });
});
