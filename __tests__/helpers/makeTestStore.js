import { createStore } from 'redux';

/**
 * Minimal Redux store for screen tests that use useTranslation (reads auth.language).
 */
export default function makeTestStore({ role = 'user', name = 'Test User', language = 'en' } = {}) {
  const initialState = {
    auth: {
      isLogin: true,
      token: 'mock-token-xyz',
      language,
      user: { _id: 'user-001', name, role, specialisation: 'Anxiety' },
      profile: {
        name,
        gender: 'male',
        age: '25',
        phone_no: '1234567890',
        concerns: [],
        profilePic: '',
      },
    },
  };
  return createStore((state = initialState) => state);
}
