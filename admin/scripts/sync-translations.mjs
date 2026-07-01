/**
 * Copy shared translations into admin/ for Vercel deploys (admin is deployed alone).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../../src/localization/translations.js');
const destDir = path.join(__dirname, '../src/localization');
const dest = path.join(destDir, 'translations.js');

if (!fs.existsSync(src)) {
  if (fs.existsSync(dest)) {
    console.log('sync-translations: using committed admin copy (parent file absent)');
    process.exit(0);
  }
  console.error('sync-translations: missing source and destination translations.js');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('sync-translations: copied to admin/src/localization/translations.js');
