import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/utils/apiClient';
import { login, verifyLoginOtp, setLanguage } from '../src/redux/actions/auth';

jest.mock('../src/utils/apiClient', () => ({
  post: jest.fn(),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
}));

function makeStore(initialAuth) {
  let state = { auth: { language: 'en', token: null, isLogin: false, ...initialAuth } };
  const dispatch = async action => {
    if (typeof action === 'function') return action(dispatch, () => state);
    if (action.type === 'SET_LANGUAGE') state = { auth: { ...state.auth, language: action.payload } };
    if (action.type === 'REGISTER_SUCCESS') {
      state = { auth: { ...state.auth, token: action.payload.token, isLogin: true } };
    }
    return action;
  };
  return { dispatch, getState: () => state };
}

function mockOtpLogin(serverLanguage) {
  api.post.mockImplementation(url => {
    if (url === '/api/auth') return Promise.resolve({ data: { otpRequired: true, email: 'a@b.com' } });
    return Promise.resolve({
      data: { token: 'tok', user: { id: '1' }, profile: { language: serverLanguage } },
    });
  });
}

async function completeLogin(store) {
  await store.dispatch(login({ email: 'a@b.com', password: 'secret123' }));
  await store.dispatch(verifyLoginOtp({ email: 'a@b.com', otp: '123456' }));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  api.post.mockReset();
  api.patch.mockClear();
});

test('a language picked on the login screen survives login and is saved to the account', async () => {
  const store = makeStore();
  mockOtpLogin('en');

  await store.dispatch(setLanguage('pa'));
  await completeLogin(store);

  expect(store.getState().auth.language).toBe('pa');
  expect(api.patch).toHaveBeenCalledWith('/api/profile/language', { language: 'pa' });
  expect(await AsyncStorage.getItem('MindCare_language_pending_sync')).toBeNull();
});

test('without a new pick, the account language is restored on login', async () => {
  const store = makeStore();
  mockOtpLogin('hi');

  await store.dispatch(setLanguage('en', { source: 'system' }));
  await completeLogin(store);

  expect(store.getState().auth.language).toBe('hi');
  expect(api.patch).not.toHaveBeenCalled();
});

test('a failed push keeps the pending choice so the next login retries', async () => {
  const store = makeStore();
  mockOtpLogin('en');
  api.patch.mockImplementationOnce(() => Promise.reject(new Error('offline')));

  await store.dispatch(setLanguage('pa'));
  await completeLogin(store);

  expect(store.getState().auth.language).toBe('pa');
  expect(await AsyncStorage.getItem('MindCare_language_pending_sync')).toBe('1');
});
