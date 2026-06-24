/**
 * Validation helpers for login/signup.
 * Pass optional `t` from useTranslation() for localized messages.
 */

const VALIDATION_KEYS = {
  email_required: ['auth.validation.email_required', 'Email is required'],
  email_must_contain_at: ['auth.validation.email_must_contain_at', 'Email must contain @'],
  email_invalid: ['auth.validation.email_invalid', 'Enter a valid email address'],
  phone_required: ['auth.validation.phone_required', 'Phone number is required'],
  phone_invalid: ['auth.validation.phone_invalid', 'Phone number must be exactly 10 digits'],
  password_required: ['auth.validation.password_required', 'Password is required'],
  password_min_length: ['auth.validation.password_min_length', 'Password must be at least 8 characters'],
  password_lowercase: ['auth.validation.password_lowercase', 'Password must include a lowercase letter'],
  password_uppercase: ['auth.validation.password_uppercase', 'Password must include an uppercase letter'],
  password_number: ['auth.validation.password_number', 'Password must include a number'],
  password_symbol: ['auth.validation.password_symbol', 'Password must include a symbol (e.g. !@#$%)'],
};

function localize(t, key) {
  const [path, fallback] = VALIDATION_KEYS[key];
  return t ? t(path, fallback) : fallback;
}

export function validateEmail(email, t) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: localize(t, 'email_required') };
  }
  const trimmed = email.trim();
  if (!trimmed.includes('@')) {
    return { valid: false, message: localize(t, 'email_must_contain_at') };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, message: localize(t, 'email_invalid') };
  }
  return { valid: true };
}

export function validatePhone(phone, t) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: localize(t, 'phone_required') };
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) {
    return { valid: false, message: localize(t, 'phone_invalid') };
  }
  return { valid: true };
}

export function validatePassword(password, t) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: localize(t, 'password_required') };
  }
  if (password.length < 8) {
    return { valid: false, message: localize(t, 'password_min_length') };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: localize(t, 'password_lowercase') };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: localize(t, 'password_uppercase') };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: localize(t, 'password_number') };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: localize(t, 'password_symbol') };
  }
  return { valid: true };
}
