/**
 * Safely rewrites all chat blocks + common.delete via full-file serialize.
 * Run: node scripts/finalize-chat-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';
import { CHAT_OVERRIDES, DELETE_LABELS } from './chat-overrides.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const en = translations.en.chat;
const merge = (o) => ({ ...en, ...o });

const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

for (const lang of LANGS) {
  if (!translations[lang]) continue;
  translations[lang].common = { ...translations[lang].common, delete: DELETE_LABELS[lang] };
  if (lang === 'en') {
    // keep extended en from file
  } else if (lang === 'hi' || lang === 'pa') {
    // already complete in file — keep
  } else if (CHAT_OVERRIDES[lang]) {
    translations[lang].chat = merge(CHAT_OVERRIDES[lang]);
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

fs.writeFileSync(outPath, `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`, 'utf8');
const counts = LANGS.map(l => `${l}:${Object.keys(translations[l]?.chat || {}).length}`);
console.log('Done.', counts.join(' '));
