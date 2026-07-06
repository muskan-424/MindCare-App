/**
 * MindCare i18n Hook
 * Provides `t(key)` — dot-separated path resolver
 * Provides `language` — current active language code
 * Falls back to English if a key is missing in the selected language.
 */

import { useCallback } from 'react';
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

  const t = useCallback((key, paramsOrFallback, fallback) => {
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
  }, [language]);

  return { t, language };
}
