import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import translations from '../../src/localization/translations.js';

const I18nContext = createContext(null);

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'मराठी' },
];

function resolve(path, obj) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage?.getItem('ADMIN_LANG') || 'en');

  const setLanguage = useCallback((lang) => {
    localStorage?.setItem('ADMIN_LANG', lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback((key, paramsOrFallback, explicitFallback) => {
    let params = null;
    let fallback = explicitFallback;
    if (paramsOrFallback != null) {
      if (typeof paramsOrFallback === 'string') fallback = paramsOrFallback;
      else if (typeof paramsOrFallback === 'object') params = paramsOrFallback;
    }
    const langDict = translations[language] || translations.en;
    const raw = resolve(key, langDict) ?? resolve(key, translations.en);
    if (raw != null && typeof raw === 'string') {
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name) => {
        const val = params[name];
        return val != null ? String(val) : `{${name}}`;
      });
    }
    return fallback !== undefined ? fallback : key;
  }, [language]);

  const value = useMemo(() => ({ t, language, setLanguage, langs: LANGS }), [t, language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
