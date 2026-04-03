/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../AuthFlow', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return function MockAuthFlow() {
    return mockReact.createElement(View, { testID: 'mock-auth-flow' });
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
