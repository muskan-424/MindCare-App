/**
 * Supported app languages — shared across Profile, Login, and Signup.
 */
const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
];

export default LANGUAGES;

export function getLanguageByCode(code) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}
