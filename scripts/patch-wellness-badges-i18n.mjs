/**
 * Patch wellness fitness strings and badge labels for non-English locales.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const PATCHES = {
  hi: {
    wellness: {
      fitness_coach_subtitle: 'अपने लक्ष्यों और पसंद के अनुसार व्यक्तिगत शेड्यूल, दिनचर्या और व्यायाम पाएं।',
      fitness_browse_label: 'या श्रेणी के अनुसार ब्राउज़ करें',
      fitness_empty_curating: 'हम आपके लिए सबसे उपयोगी सामग्री तैयार कर रहे हैं।',
    },
    badges: {
      your_badges: 'आपकी उपलब्धियां ({earned} / {total})',
      first_checkin_label: 'पहला कदम',
      first_checkin_desc: 'आपका पहला मूड चेक-इन',
      week_warrior_label: 'सप्ताह योद्धा',
      week_warrior_desc: '7-दिन की लकीर बनाए रखी',
      fortnight_focus_label: 'पखवाड़ा फोकस',
      fortnight_focus_desc: '14-दिन की लकीर बनाए रखी',
      monthly_master_label: 'मासिक मास्टर',
      monthly_master_desc: '30-दिन की लकीर बनाए रखी',
      mood_explorer_label: 'मूड खोजकर्ता',
      mood_explorer_desc: '10 मूड चेक-इन दर्ज किए',
      consistent_50_label: 'निरंतर मन',
      consistent_50_desc: '50 मूड चेक-इन दर्ज किए',
      centurion_label: 'सेंचुरियन',
      centurion_desc: '100 मूड चेक-इन दर्ज किए',
    },
  },
  pa: {
    wellness: {
      fitness_coach_subtitle: 'ਆਪਣੇ ਟੀਚਿਆਂ ਅਤੇ ਪਸੰਦਾਂ ਅਨੁਸਾਰ ਨਿੱਜੀ ਸ਼ਡ्यूਲ, ਰੁਟੀਨ ਅਤੇ ਕਸਰਤਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।',
      fitness_browse_label: 'ਜਾਂ ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਬ੍ਰਾਊਜ਼ ਕਰੋ',
      fitness_empty_curating: 'ਅਸੀਂ ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਉਪਯੋਗੀ ਸਮੱਗਰੀ ਤਿਆਰ ਕਰ ਰਹੇ ਹਾਂ।',
    },
    badges: {
      your_badges: 'ਤੁਹਾਡੀਆਂ ਉਪਲਬਧੀਆਂ ({earned} / {total})',
      first_checkin_label: 'ਪਹਿਲਾ ਕਦਮ',
      first_checkin_desc: 'ਤੁਹਾਡਾ ਪਹਿਲਾ ਮੂਡ ਚੈਕ-ਇਨ',
      week_warrior_label: 'ਹਫ਼ਤਾ ਯੋਧਾ',
      week_warrior_desc: '7-ਦਿਨ ਦੀ ਲੜੀ ਬਣਾਈ ਰੱਖੀ',
      fortnight_focus_label: 'ਪੰਦਰ੍ਹਾਂ ਦਿਨ ਫੋਕਸ',
      fortnight_focus_desc: '14-ਦਿਨ ਦੀ ਲੜੀ ਬਣਾਈ ਰੱਖੀ',
      monthly_master_label: 'ਮਹੀਨਾਵਾਰ ਮਾਸਟਰ',
      monthly_master_desc: '30-ਦਿਨ ਦੀ ਲੜੀ ਬਣਾਈ ਰੱਖੀ',
      mood_explorer_label: 'ਮੂਡ ਖੋਜੀ',
      mood_explorer_desc: '10 ਮੂਡ ਚੈਕ-ਇਨ ਦਰਜ ਕੀਤੇ',
      consistent_50_label: 'ਨਿਰੰਤਰ ਮਨ',
      consistent_50_desc: '50 ਮੂਡ ਚੈਕ-ਇਨ ਦਰਜ ਕੀਤੇ',
      centurion_label: 'ਸੈਂਚੁਰੀਅਨ',
      centurion_desc: '100 ਮੂਡ ਚੈਕ-ਇਨ ਦਰਜ ਕੀਤੇ',
    },
  },
  mr: {
    wellness: {
      fitness_coach_subtitle: 'तुमच्या उद्दिष्टांनुसार वैयक्तिक वेळापत्रक, दिनचर्या आणि व्यायाम मिळवा.',
      fitness_browse_label: 'किंवा श्रेणीनुसार ब्राउझ करा',
      fitness_empty_curating: 'आम्ही तुमच्यासाठी सर्वात उपयुक्त सामग्री तयार करत आहोत.',
    },
    badges: {
      your_badges: 'तुमची उपलब्धी ({earned} / {total})',
      first_checkin_label: 'पहिले पाऊल',
      first_checkin_desc: 'तुमचा पहिला मूड चेक-इन',
      week_warrior_label: 'आठवडा योद्धा',
      week_warrior_desc: '7-दिवसांची साखळी राखली',
      fortnight_focus_label: 'पंधरा दिवस फोकस',
      fortnight_focus_desc: '14-दिवसांची साखळी राखली',
      monthly_master_label: 'मासिक मास्टर',
      monthly_master_desc: '30-दिवसांची साखळी राखली',
      mood_explorer_label: 'मूड एक्सप्लोरर',
      mood_explorer_desc: '10 मूड चेक-इन नोंदवले',
      consistent_50_label: 'सातत्यपूर्ण मन',
      consistent_50_desc: '50 मूड चेक-इन नोंदवले',
      centurion_label: 'शंभरपलट',
      centurion_desc: '100 मूड चेक-इन नोंदवले',
    },
  },
  es: {
    wellness: {
      fitness_coach_subtitle: 'Obtén un horario personalizado, rutinas y ejercicios según tus metas.',
      fitness_browse_label: 'O explorar por categoría',
      fitness_empty_curating: 'Estamos preparando el contenido más útil para ti.',
    },
    badges: {
      your_badges: 'Tus insignias ({earned} / {total})',
      first_checkin_label: 'Primer paso',
      first_checkin_desc: 'Registraste tu primer estado de ánimo',
      week_warrior_label: 'Guerrero semanal',
      week_warrior_desc: 'Mantuviste una racha de 7 días',
      fortnight_focus_label: 'Enfoque quincenal',
      fortnight_focus_desc: 'Mantuviste una racha de 14 días',
      monthly_master_label: 'Maestro mensual',
      monthly_master_desc: 'Mantuviste una racha de 30 días',
      mood_explorer_label: 'Explorador de ánimo',
      mood_explorer_desc: 'Registraste 10 estados de ánimo',
      consistent_50_label: 'Mente constante',
      consistent_50_desc: 'Registraste 50 estados de ánimo',
      centurion_label: 'Centurión',
      centurion_desc: 'Registraste 100 estados de ánimo',
    },
  },
  fr: {
    wellness: {
      fitness_coach_subtitle: 'Obtenez un programme personnalisé selon vos objectifs et préférences.',
      fitness_browse_label: 'Ou parcourir par catégorie',
      fitness_empty_curating: 'Nous préparons le contenu le plus utile pour vous.',
    },
    badges: {
      your_badges: 'Vos badges ({earned} / {total})',
      first_checkin_label: 'Premier pas',
      first_checkin_desc: 'Votre premier suivi d\'humeur',
      week_warrior_label: 'Guerrier de la semaine',
      week_warrior_desc: 'Série de 7 jours maintenue',
      fortnight_focus_label: 'Focus quinzaine',
      fortnight_focus_desc: 'Série de 14 jours maintenue',
      monthly_master_label: 'Maître mensuel',
      monthly_master_desc: 'Série de 30 jours maintenue',
      mood_explorer_label: 'Explorateur d\'humeur',
      mood_explorer_desc: '10 suivis d\'humeur enregistrés',
      consistent_50_label: 'Esprit constant',
      consistent_50_desc: '50 suivis d\'humeur enregistrés',
      centurion_label: 'Centurion',
      centurion_desc: '100 suivis d\'humeur enregistrés',
    },
  },
};

for (const lang of LANGS) {
  const patch = PATCHES[lang];
  if (!patch) continue;
  for (const [section, keys] of Object.entries(patch)) {
    if (!translations[lang][section]) translations[lang][section] = {};
    Object.assign(translations[lang][section], keys);
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
console.log('patched wellness fitness + badge strings for', Object.keys(PATCHES).join(', '));
