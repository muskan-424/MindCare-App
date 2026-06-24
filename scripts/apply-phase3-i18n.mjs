/**
 * Merges Phase 3 i18n blocks into translations.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';
import {
  LANGS,
  AUTH_BLOCKS,
  CRISIS_BLOCKS,
  CONCERNS_BLOCKS,
  JOURNAL_BLOCKS,
  HOME_EXTRAS,
  PROFILE_EXTRAS,
  COMMON_EXTRAS,
} from './phase3-i18n-blocks.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');

for (const lang of LANGS) {
  if (!translations[lang]) continue;
  translations[lang].auth = AUTH_BLOCKS[lang];
  translations[lang].crisis = CRISIS_BLOCKS[lang];
  translations[lang].concerns = CONCERNS_BLOCKS[lang];
  translations[lang].journal = JOURNAL_BLOCKS[lang];
  translations[lang].home = { ...translations[lang].home, ...HOME_EXTRAS[lang] };
  translations[lang].profile = { ...translations[lang].profile, ...PROFILE_EXTRAS[lang] };
  translations[lang].common = { ...translations[lang].common, ...COMMON_EXTRAS[lang] };
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
console.log('Wrote', outPath, '— langs with auth:', LANGS.filter(l => translations[l]?.auth).length);
