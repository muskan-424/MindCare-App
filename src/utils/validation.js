/**
 * Validation helpers for login/signup.
 * - Email: must contain @
 * - Phone: exactly 10 digits
 * - Password: min 8 chars, at least one number, one symbol, one uppercase, one lowercase
 */

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, message: 'Email is required' };
  const trimmed = email.trim();
  if (!trimmed.includes('@')) return { valid: false, message: 'Email must contain @' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { valid: false, message: 'Enter a valid email address' };
  return { valid: true };
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return { valid: false, message: 'Phone number is required' };
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return { valid: false, message: 'Phone number must be exactly 10 digits' };
  return { valid: true };
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return { valid: false, message: 'Password is required' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must include a lowercase letter' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must include an uppercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must include a number' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, message: 'Password must include a symbol (e.g. !@#$%)' };
  return { valid: true };
}
