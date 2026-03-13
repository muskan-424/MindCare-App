import { UPDATE_QUOTE_OF_THE_DAY } from './type';
import api from '../../utils/apiClient';
import { Platform } from 'react-native';

const DEFAULT_QUOTE = 'Be yourself no matter what they say!';

export const fetchQuoteOfTheDay = () => async dispatch => {
  try {
    const res = await api.get('/api/quotes/');
    const data = res.data?.quote != null ? res.data : { quote: DEFAULT_QUOTE };
    dispatch({
      type: UPDATE_QUOTE_OF_THE_DAY,
      payload: data,
    });
    if (Platform.OS === 'android' && res.data?.quote) {
      const { ToastAndroid } = require('react-native');
      ToastAndroid.show(res.data.quote, ToastAndroid.SHORT);
    }
  } catch (err) {
    dispatch({
      type: UPDATE_QUOTE_OF_THE_DAY,
      payload: { quote: DEFAULT_QUOTE },
    });
  }
};
