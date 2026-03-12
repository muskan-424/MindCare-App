import { REGISTER_SUCCESS, REGISTER_FAIL } from './type';
import api from '../../utils/apiClient';
import { ToastAndroid } from 'react-native';
import { fetchQuoteOfTheDay } from './quote';

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
    dispatch({ type: REGISTER_SUCCESS, payload: res.data });
  } catch (err) {
    const message = err.response?.data?.errors?.[0]?.msg || err.message || 'Registration failed. Server may be unreachable.';
    ToastAndroid.show(message, ToastAndroid.SHORT);
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
    dispatch({ type: REGISTER_SUCCESS, payload: res.data });

    //dispatch(fetchQuoteOfTheDay());
  } catch (err) {
    const message = err.response?.data?.errors?.[0]?.msg || err.message || 'Login failed. Server may be unreachable.';
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
};
