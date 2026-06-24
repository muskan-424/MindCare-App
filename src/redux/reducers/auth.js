import {
  REGISTER_FAIL,
  REGISTER_SUCCESS,
  CLEAR_WELCOME,
  CONCERN_UPDATE,
  UPDATE_USER,
  LOGOUT,
  SET_LANGUAGE,
} from '../actions/type';


const initialState = {
  isLogin: false,
  user: null,
  token: null,
  profile: {
    name: 'Ritika Tomar',
  },
  welcomeMessage: null,
  language: 'en',
};


export default function(state = initialState, action) {
  switch (action.type) {
    case REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        profile: action.payload.profile,
        token: action.payload.token || state.token,
        isLogin: true,
        welcomeMessage: action.meta?.from || 'signed_in',
      };
    case REGISTER_FAIL:
      return {
        ...state,
        user: null,
        token: null,
        profile: null,
        isLogin: false,
        welcomeMessage: null,
      };
    case LOGOUT:
      return {
        ...initialState,
        language: state.language,
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
    case SET_LANGUAGE:
      return {
        ...state,
        language: action.payload,
      };
    default:
      return state;
  }
}
