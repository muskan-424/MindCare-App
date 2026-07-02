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
    dispatch({ type: REGISTER_SUCCESS, payload: res.data, meta: { from: 'login' } });
    await syncLanguageFromAuthResponse(dispatch, getState, res.data.profile);
  } catch (err) {
    const lang = getState().auth.language || 'en';
    const raw = err.response?.data?.errors?.[0]?.msg || err.message || 'Login failed. Server may be unreachable.';
    const message = mapAuthApiError(raw, lang);
    showToast(message);
    throw new Error(message);
  }
};

export const logout = () => dispatch => {
  dispatch({ type: LOGOUT });
};

/**
 * setLanguage — persists the selected language code and updates Redux state.
 * Syncs to server when the user is logged in.
 * @param {string} lang - ISO 639-1 language code, e.g. 'hi', 'pa', 'mr'
 */
export const setLanguage = (lang) => async (dispatch, getState) => {
  try {
    await AsyncStorage.setItem('MindCare_language', lang);
  } catch (_) {
    // Ignore storage errors — state change still happens
  }
  dispatch({ type: SET_LANGUAGE, payload: lang });

  const token = getState().auth?.token;
  if (token) {
    try {
      await api.patch('/api/profile/language', { language: lang });
    } catch (_) {
      // Offline or unauthenticated — local preference still applies
    }
  }
};

async function syncLanguageFromAuthResponse(dispatch, getState, profile) {
  const serverLang = profile?.language;
  const clientLang = getState().auth.language || 'en';
  if (serverLang) {
    await dispatch(setLanguage(serverLang));
  } else if (clientLang) {
    try {
      await api.patch('/api/profile/language', { language: clientLang });
    } catch (_) {
      // Ignore — preference remains local
    }
  }
}
