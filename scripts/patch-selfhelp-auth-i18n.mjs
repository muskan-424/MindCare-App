/**
 * Patch self-help tools, auth, crisis, and concerns across supported languages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';
import { SELFHELP_BY_LANG, SELFHELP_SECTIONS } from './selfhelp-locale-patches.mjs';
import { AUTH_BY_LANG, CRISIS_BY_LANG, CONCERNS_BY_LANG } from './auth-locale-patches.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

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

for (const lang of LANGS) {
  const selfhelp = SELFHELP_BY_LANG[lang];
  if (selfhelp) {
    for (const section of SELFHELP_SECTIONS) {
      if (!selfhelp[section]) continue;
      if (!translations[lang][section]) translations[lang][section] = {};
      translations[lang][section] = deepMerge(translations[lang][section], selfhelp[section]);
    }
  }

  if (AUTH_BY_LANG[lang]) {
    translations[lang].auth = deepMerge(translations[lang].auth || {}, AUTH_BY_LANG[lang]);
  }
  if (CRISIS_BY_LANG[lang]) {
    translations[lang].crisis = { ...translations[lang].crisis, ...CRISIS_BY_LANG[lang] };
  }
  if (CONCERNS_BY_LANG[lang]) {
    translations[lang].concerns = { ...translations[lang].concerns, ...CONCERNS_BY_LANG[lang] };
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

const body = LANGS.map((lang) => `  ${lang}: {\n${serializeSection(translations[lang], 2)}\n  },`).join('\n\n');
fs.writeFileSync(outPath, `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`);
console.log('patched selfhelp, auth, crisis, concerns across', Object.keys(SELFHELP_BY_LANG).length, 'languages');

import { spawnSync } from 'child_process';
const sync = spawnSync('node', ['admin/scripts/sync-translations.mjs'], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
if (sync.status !== 0) process.exit(sync.status ?? 1);
