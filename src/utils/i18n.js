/**
 * MindCare i18n Hook
 * Provides `t(key)` — dot-separated path resolver
 * Provides `language` — current active language code
 * Falls back to English if a key is missing in the selected language.
 */

import { useSelector } from 'react-redux';
import translations from '../localization/translations';

/**
 * Resolves a dot-separated path against an object.
 * e.g. resolve('home.greeting_morning', {home:{greeting_morning:'Good Morning'}})
 *      => 'Good Morning'
 */
function resolve(path, obj) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * useTranslation()
 * @returns {{ t: (key: string, fallback?: string) => string, language: string }}
 */
export default function useTranslation() {
  const language = useSelector(state => state.auth.language) || 'en';

  const langDict = translations[language] || translations['en'];
  const fallbackDict = translations['en'];

  /**
   * t(key, paramsOrFallback)
   * @param {string} key - dot-separated key e.g. 'home.greeting_morning'
   * @param {string|Record<string, string|number>} [paramsOrFallback]
   *   - optional interpolation map, e.g. { name: 'Rahul' } replaces {name}
   *   - or a fallback string if key not found
   * @param {string} [fallback] - explicit fallback when second arg is params
   * @returns {string}
   */
  function t(key, paramsOrFallback, fallback) {
    let params = null;
    let explicitFallback = fallback;

    if (paramsOrFallback != null) {
      if (typeof paramsOrFallback === 'string') {
        explicitFallback = paramsOrFallback;
      } else if (typeof paramsOrFallback === 'object') {
        params = paramsOrFallback;
      }
    }

    const raw = resolve(key, langDict) ?? resolve(key, fallbackDict);
    if (raw != null && typeof raw === 'string') {
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name) => {
        const val = params[name];
        return val != null ? String(val) : `{${name}}`;
      });
    }
    return explicitFallback !== undefined ? explicitFallback : key;
  }

  return { t, language };
}
