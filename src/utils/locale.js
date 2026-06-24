/**
 * Locale helpers — BCP47 mapping and locale-aware date formatting.
 */

export const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml',
  'es', 'fr', 'de', 'pt', 'ar', 'zh',
];

const BCP47_MAP = {
  en: 'en-US',
  hi: 'hi-IN',
  pa: 'pa-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  ar: 'ar-SA',
  zh: 'zh-CN',
};

/** Map app language code to BCP47 locale tag for Intl APIs. */
export function getBcp47Locale(language) {
  return BCP47_MAP[language] || BCP47_MAP.en;
}

/** Map device locale tag (e.g. hi-IN) to supported app language code. */
export function mapDeviceLocale(deviceLocale) {
  if (!deviceLocale || typeof deviceLocale !== 'string') return 'en';
  const primary = deviceLocale.split('-')[0].toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(primary)) return primary;
  return 'en';
}

/** Detect best supported language from device settings via react-native-localize. */
export function detectDeviceLanguage() {
  try {
    const RNLocalize = require('react-native-localize');
    const locales = RNLocalize.getLocales?.() || [];
    for (const loc of locales) {
      const tag = loc.languageTag || `${loc.languageCode}-${loc.countryCode || ''}`;
      const mapped = mapDeviceLocale(tag);
      if (mapped !== 'en' || (loc.languageCode || '').toLowerCase() === 'en') {
        return mapped;
      }
    }
  } catch (_) {
    // react-native-localize not linked or unavailable in tests
  }
  return 'en';
}

/**
 * formatDate — locale-aware date string.
 * @param {Date|string|number} date
 * @param {string} language - app language code
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(date, language, options) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getBcp47Locale(language), options);
}

/**
 * formatDateShort — today shows localized "Today", otherwise short date.
 * @param {Date|string|number} date
 * @param {string} language
 * @param {(key: string, fallback?: string) => string} [t]
 */
export function formatDateShort(date, language, t) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return t ? t('common.today', 'Today') : 'Today';
  }
  return formatDate(d, language, { day: 'numeric', month: 'short' });
}

/**
 * formatDateTime — locale-aware date + time.
 */
export function formatDateTime(date, language, dateOptions, timeOptions) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const locale = getBcp47Locale(language);
  const dateStr = d.toLocaleDateString(locale, dateOptions || { month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString(locale, timeOptions || { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} ${timeStr}`;
}
