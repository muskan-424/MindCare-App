/**
 * Propagate Phase 4 i18n sections from English to all 16 languages.
 * hi/pa/mr get real translations; other langs get English placeholders.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';
import { HI_OVERRIDES, PA_OVERRIDES, MR_OVERRIDES } from './phase4-hi-pa-mr-overrides.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');

const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const PHASE4_SECTIONS = [
  'mood_check', 'goals', 'wellness', 'badges', 'breathing', 'affirmations',
  'gratitude', 'grounding', 'blog', 'streak', 'appointments', 'therapy',
  'assessment', 'admin', 'safety', 'emergency', 'institution',
];

const HOME_EXTRAS = ['notifications_title', 'notifications_loading', 'notifications_empty'];

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] || {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const enSource = translations.en;
const enBlocks = {};
for (const section of PHASE4_SECTIONS) {
  if (enSource[section]) enBlocks[section] = enSource[section];
}
const enHomeExtras = {};
for (const key of HOME_EXTRAS) {
  if (enSource.home?.[key]) enHomeExtras[key] = enSource.home[key];
}

const OVERRIDES = { hi: HI_OVERRIDES, pa: PA_OVERRIDES, mr: MR_OVERRIDES };

for (const lang of LANGS) {
  if (lang === 'en' || !translations[lang]) continue;

  for (const section of PHASE4_SECTIONS) {
    if (enBlocks[section]) {
      const base = JSON.parse(JSON.stringify(enBlocks[section]));
      const override = OVERRIDES[lang]?.[section];
      translations[lang][section] = override ? deepMerge(base, override) : base;
    }
  }

  if (Object.keys(enHomeExtras).length) {
    translations[lang].home = { ...translations[lang].home, ...enHomeExtras };
    if (OVERRIDES[lang]?.home) {
      translations[lang].home = deepMerge(translations[lang].home, OVERRIDES[lang].home);
    }
  }

  // Ensure common extras from en
  const commonExtras = { success: 'Success', required: 'Required' };
  translations[lang].common = { ...translations[lang].common, ...commonExtras };
  if (OVERRIDES[lang]?.common) {
    translations[lang].common = deepMerge(translations[lang].common, OVERRIDES[lang].common);
  }
}

function serializeSection(obj, depth) {
  const pad = '  '.repeat(depth);
  return Object.entries(obj)
    .map(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return `${pad}${key}: {\n${serializeSection(val, depth + 1)}\n${pad}},`;
      }
      return `${pad}${key}: ${JSON.stringify(val)},`;
    })
    .join('\n');
}

const header = `/**
 * MindCare App — Localization Dictionary
 * Supports: English (en), Hindi (hi), Punjabi (pa), Marathi (mr),
 *           Bengali (bn), Telugu (te), Tamil (ta), Gujarati (gu),
 *           Kannada (kn), Malayalam (ml), Spanish (es),
 *           French (fr), German (de), Portuguese (pt),
 *           Arabic (ar), Chinese – Simplified (zh)
 *
 * Note: any key missing from a given language automatically falls back
 * to English (see utils/i18n.js), so partial coverage is safe.
 */

`;

const body = LANGS.filter(l => translations[l])
  .map(lang => `  ${lang}: {\n${serializeSection(translations[lang], 2)}\n  },`)
  .join('\n\n');

const file = `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`;
fs.writeFileSync(outPath, file, 'utf8');
console.log('Phase 4 i18n applied — sections:', PHASE4_SECTIONS.join(', '));
