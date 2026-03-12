import {
  REGISTER_FAIL,
  REGISTER_SUCCESS,
  CLEAR_WELCOME,
  CONCERN_UPDATE,
  UPDATE_USER,
} from '../actions/type';

const initialState = {
  isLogin: false,
  user: null,
  profile: {
    name: 'Ritika Tomar',
  },
  welcomeMessage: null, // 'login' | 'signup' | null for on-screen confirmation
};

export default function(state = initialState, action) {
  switch (action.type) {
    case REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        isLogin: true,
        welcomeMessage: action.meta?.from || 'signed_in',
      };
    case REGISTER_FAIL:
      return {
        ...state,
        user: null,
        profile: null,
        isLogin: false,
        welcomeMessage: null,
      };
    case CLEAR_WELCOME:
      return { ...state, welcomeMessage: null };
    case CONCERN_UPDATE:
      return {
        ...state,
        profile: action.payload,
      };
    case UPDATE_USER:
      return {
        ...state,
        // user:action.payload.user,
        profile: action.payload,
      };
    default:
      return state;
  }
}
