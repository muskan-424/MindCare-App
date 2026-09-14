import { REGISTER_SUCCESS, CLEAR_WELCOME, LOGOUT, SET_LANGUAGE } from './type';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../../utils/apiClient';
import { ToastAndroid, Platform } from 'react-native';
import { mapAuthApiError } from '../../utils/authErrors';

export const clearWelcome = () => ({ type: CLEAR_WELCOME });

function showToast(message) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
}

export const register = ({
  name,
  email,
  password,
  gender,
  age,
  phone_no,
  role,
  specialisation,
}) => async (dispatch, getState) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ name, email, password, age, gender, phone_no, role, specialisation });
  try {
    const res = await api.post('/api/user', body, config);
    dispatch({ type: REGISTER_SUCCESS, payload: res.data, meta: { from: 'signup' } });
    await syncLanguageFromAuthResponse(dispatch, getState, res.data.profile);
  } catch (err) {
    const lang = getState().auth.language || 'en';
    const raw = err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed. Server may be unreachable.';
    const message = mapAuthApiError(raw, lang);
    showToast(message);
    throw new Error(message);
  }
};

export const login = ({ email, password }) => async (dispatch, getState) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const body = JSON.stringify({ email, password });
  try {
    const res = await api.post('/api/auth', body, config);
    if (res.data.otpRequired) {
      return { otpRequired: true, email: res.data.email };
    }
    dispatch({ type: REGISTER_SUCCESS, payload: res.data, meta: { from: 'login' } });
    await syncLanguageFromAuthResponse(dispatch, getState, res.data.profile);
    return { otpRequired: false };
  } catch (err) {
    const lang = getState().auth.language || 'en';
    const raw = err.response?.data?.errors?.[0]?.msg || err.message || 'Login failed. Server may be unreachable.';
    const message = mapAuthApiError(raw, lang);
    showToast(message);
    throw new Error(message);
  }
};

export const verifyLoginOtp = ({ email, otp }) => async (dispatch, getState) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const body = JSON.stringify({ email, otp });
  try {
    const res = await api.post('/api/auth/verify-login-otp', body, config);
    dispatch({ type: REGISTER_SUCCESS, payload: res.data, meta: { from: 'login' } });
    await syncLanguageFromAuthResponse(dispatch, getState, res.data.profile);
  } catch (err) {
    const lang = getState().auth.language || 'en';
    const raw = err.response?.data?.errors?.[0]?.msg || err.message || 'Verification failed.';
    const message = mapAuthApiError(raw, lang);
    showToast(message);
    throw new Error(message);
  }
};

export const resendLoginOtp = ({ email }) => async () => {
  await api.post('/api/auth/resend-login-otp', JSON.stringify({ email }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const logout = () => dispatch => {
  dispatch({ type: LOGOUT });
};

// Set when the user picks a language while logged out, so the next login
// pushes that choice to the account instead of overwriting it with the saved one.
const PENDING_LANGUAGE_KEY = 'MindCare_language_pending_sync';

/**
 * setLanguage — persists the selected language code and updates Redux state.
 * @param {string} lang - ISO 639-1 language code, e.g. 'hi', 'pa', 'mr'
 * @param {{ source?: 'user' | 'system' }} [options] - 'system' applies the language
 *   locally only (device detection, restoring storage, server sync) without
 *   treating it as a new user choice.
 */
export const setLanguage = (lang, { source = 'user' } = {}) => async (dispatch, getState) => {
  try {
    await AsyncStorage.setItem('MindCare_language', lang);
  } catch (_) {
    // Ignore storage errors — state change still happens
  }
  dispatch({ type: SET_LANGUAGE, payload: lang });

  if (source !== 'user') return;

  const token = getState().auth?.token;
  if (!token) {
    try {
      await AsyncStorage.setItem(PENDING_LANGUAGE_KEY, '1');
    } catch (_) {
      // Ignore — worst case the account's saved language wins at login
    }
    return;
  }
  try {
    await api.patch('/api/profile/language', { language: lang });
  } catch (_) {
    // Offline or unauthenticated — local preference still applies
  }
};

async function syncLanguageFromAuthResponse(dispatch, getState, profile) {
  const serverLang = profile?.language;
  const clientLang = getState().auth.language || 'en';

  let pendingChoice = false;
  try {
    pendingChoice = (await AsyncStorage.getItem(PENDING_LANGUAGE_KEY)) === '1';
  } catch (_) {
    // Treat as no pending choice
  }

  if (serverLang && !pendingChoice) {
    if (serverLang !== clientLang) {
      await dispatch(setLanguage(serverLang, { source: 'system' }));
    }
    return;
  }

  if (serverLang !== clientLang) {
    try {
      await api.patch('/api/profile/language', { language: clientLang });
    } catch (_) {
      return; // Keep the pending flag so the next login retries the push
    }
  }
  try {
    await AsyncStorage.removeItem(PENDING_LANGUAGE_KEY);
  } catch (_) {
    // Ignore
  }
}
