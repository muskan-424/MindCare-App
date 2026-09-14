/**
 * Apply flat-key translation fixes from scripts/locale-fixes/<lang>.mjs to
 * src/localization/translations.js, then sync the admin copy.
 *
 * Each fix module default-exports { 'namespace.key': 'translated text', ... }.
 * Usage: node scripts/apply-locale-fixes.mjs [lang ...]   (default: all fix files)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawnSync } from 'child_process';
import translations from '../src/localization/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const fixesDir = path.join(__dirname, 'locale-fixes');
const LANGS = Object.keys(translations);

const requested = process.argv.slice(2);
const fixFiles = fs.existsSync(fixesDir)
  ? fs.readdirSync(fixesDir).filter(f => f.endsWith('.mjs')).map(f => f.replace(/\.mjs$/, ''))
  : [];
const toApply = requested.length ? requested : fixFiles;

function placeholders(text) {
  return (String(text).match(/\{\w+\}/g) || []).sort().join(',');
}

function getPath(obj, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

function setPath(obj, key, value) {
  const parts = key.split('.');
  let node = obj;
  for (const part of parts.slice(0, -1)) {
    if (!node[part] || typeof node[part] !== 'object') node[part] = {};
    node = node[part];
  }
  node[parts[parts.length - 1]] = value;
}

let applied = 0;
for (const lang of toApply) {
  if (!LANGS.includes(lang) || lang === 'en') throw new Error(`Unknown or disallowed locale: ${lang}`);
  const { default: fixes } = await import(pathToFileURL(path.join(fixesDir, `${lang}.mjs`)).href);
  for (const [key, value] of Object.entries(fixes)) {
    const source = getPath(translations.en, key);
    if (typeof source !== 'string') throw new Error(`${lang}: "${key}" is not an English string key`);
    if (placeholders(source) !== placeholders(value)) {
      throw new Error(`${lang}: "${key}" placeholders ${placeholders(value)} do not match English ${placeholders(source)}`);
    }
    setPath(translations[lang], key, value);
    applied += 1;
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

const body = LANGS.map(lang => `  ${lang}: {\n${serializeSection(translations[lang], 2)}\n  },`).join('\n\n');
fs.writeFileSync(outPath, `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`);
console.log(`applied ${applied} strings from: ${toApply.join(', ') || '(none)'}`);

const sync = spawnSync('node', ['admin/scripts/sync-translations.mjs'], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
if (sync.status !== 0) process.exit(sync.status ?? 1);
