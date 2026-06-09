/* global jest */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// ── Async Storage ──────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// ── WebView ────────────────────────────────────────────────────────────────────
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => React.createElement(View, props, props.children),
  };
});

// ── Sound Player ───────────────────────────────────────────────────────────────
jest.mock('react-native-sound-player', () => ({
  playUrl: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  loadUrl: jest.fn(),
  setVolume: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// ── React Native SVG (required by react-native-chart-kit) ─────────────────────
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const stub = (props) => React.createElement(View, props);
  return {
    Svg: stub, G: stub, Circle: stub, Ellipse: stub, Line: stub, Path: stub,
    Polygon: stub, Polyline: stub, Rect: stub, Symbol: stub, Text: stub,
    Use: stub, Defs: stub, Stop: stub, LinearGradient: stub,
    RadialGradient: stub, ClipPath: stub, TSpan: stub, default: stub,
  };
});

// ── Voice (speech-to-text) ───────────────────────────────────────────────────
jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(() => Promise.resolve()),
    removeAllListeners: jest.fn(),
    onSpeechResults: null,
    onSpeechPartialResults: null,
    onSpeechError: null,
    onSpeechEnd: null,
  },
}));

// ── TTS (text-to-speech) ──────────────────────────────────────────────────────
jest.mock('react-native-tts', () => ({
  __esModule: true,
  default: {
    speak: jest.fn(),
    stop: jest.fn(),
    setDefaultLanguage: jest.fn(),
  },
}));

// ── Redux store (prevent unresolved modules) ───────────────────────────────────
jest.mock('./src/redux/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({ auth: { token: 'mock-token' } }),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));
