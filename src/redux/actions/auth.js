import { REGISTER_SUCCESS, CLEAR_WELCOME, LOGOUT } from './type';
import api from '../../utils/apiClient';
import { ToastAndroid, Platform } from 'react-native';

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
}) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const body = JSON.stringify({ name, email, password, age, gender, phone_no });
  try {
    const res = await api.post('/api/user', body, config);
    dispatch({ type: REGISTER_SUCCESS, payload: res.data, meta: { from: 'signup' } });
  } catch (err) {
    const message = err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed. Server may be unreachable.';
    showToast(message);
    throw new Error(message);
  }
};

export const login = ({ email, password }) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const body = JSON.stringify({ email, password });
  try {
    const res = await api.post('/api/auth', body, config);
    dispatch({ type: REGISTER_SUCCESS, payload: res.data, meta: { from: 'login' } });

    //dispatch(fetchQuoteOfTheDay());
  } catch (err) {
    const message = err.response?.data?.errors?.[0]?.msg || err.message || 'Login failed. Server may be unreachable.';
    showToast(message);
    throw new Error(message);
  }
};

export const logout = () => dispatch => {
  dispatch({ type: LOGOUT });
};

