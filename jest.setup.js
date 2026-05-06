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

// ── Redux store (prevent unresolved modules) ───────────────────────────────────
jest.mock('./src/redux/store', () => ({
  default: {
    getState: () => ({ auth: { token: 'mock-token' } }),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));
