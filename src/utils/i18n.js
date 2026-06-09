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
   * t(key, fallback)
   * @param {string} key - dot-separated key e.g. 'home.greeting_morning'
   * @param {string} [fallback] - optional fallback string if key not found in any dict
   * @returns {string}
   */
  function t(key, fallback) {
    const value = resolve(key, langDict) ?? resolve(key, fallbackDict);
    if (value != null && typeof value === 'string') return value;
    // Return fallback or the key itself as a last resort
    return fallback !== undefined ? fallback : key;
  }

  return { t, language };
}
