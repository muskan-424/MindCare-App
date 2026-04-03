/* global jest */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props) => React.createElement(View, props, props.children),
  };
});
jest.mock('react-native-sound-player', () => ({
  playUrl: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  loadUrl: jest.fn(),
  setVolume: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
