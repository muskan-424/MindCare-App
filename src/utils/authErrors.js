import translations from '../localization/translations';

const API_ERROR_MAP = {
  'Invalid credentials': 'auth.api_invalid_credentials',
  'User already exists': 'auth.api_user_exists',
  'Server error': 'auth.api_server_error',
};

function resolve(path, obj) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function translateKey(language, key) {
  const dict = translations[language] || translations.en;
  return resolve(key, dict) ?? resolve(key, translations.en);
}

/**
 * Maps common English API auth errors to localized strings.
 */
export function mapAuthApiError(message, language = 'en') {
  if (!message) return translateKey(language, 'auth.login_failed');

  const mapped = API_ERROR_MAP[message];
  if (mapped) return translateKey(language, mapped);

  if (message.includes('Registration failed')) {
    return translateKey(language, 'auth.signup_unreachable');
  }
  if (message.includes('Login failed')) {
    return translateKey(language, 'auth.login_unreachable');
  }

  return message;
}
