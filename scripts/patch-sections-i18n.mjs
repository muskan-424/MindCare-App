/**
 * Patch assessment.*, home.* extras, and wellness plan flow across all supported languages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';
import { ASSESSMENT_BY_LANG } from './assessment-locale-patches.mjs';
import { HOME_BY_LANG } from './home-locale-patches.mjs';
import { WELLNESS_PLAN_BY_LANG } from './wellness-plan-locale-patches.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const SECTIONS = [
  ['assessment', ASSESSMENT_BY_LANG],
  ['home', HOME_BY_LANG],
  ['wellness', WELLNESS_PLAN_BY_LANG],
];

for (const lang of LANGS) {
  for (const [section, byLang] of SECTIONS) {
    const patch = byLang[lang];
    if (!patch) continue;
    if (!translations[lang][section]) translations[lang][section] = {};
    Object.assign(translations[lang][section], patch);
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
console.log(
  `patched assessment (${Object.keys(ASSESSMENT_BY_LANG.hi).length}), home (${Object.keys(HOME_BY_LANG.hi).length}), wellness (${Object.keys(WELLNESS_PLAN_BY_LANG.hi).length}) across ${Object.keys(ASSESSMENT_BY_LANG).length} languages`,
);

import { spawnSync } from 'child_process';
const sync = spawnSync('node', ['admin/scripts/sync-translations.mjs'], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
if (sync.status !== 0) process.exit(sync.status ?? 1);
