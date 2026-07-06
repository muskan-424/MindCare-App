module.exports = {
  preset: 'react-native',
  // Backend has its own Jest config (backend/jest.config.js) — keep suites separate.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/backend/', '<rootDir>/__tests__/helpers/'],
  setupFiles: [
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // ✅ Whitelist all native/community packages so Babel can transform them in Jest
  transformIgnorePatterns: [
    `node_modules/(?!(` +
      `jest-react-native|` +
      `react-native|` +
      `react-native-.*|` +
      `@react-native|` +
      `@react-native-.*|` +
      `@react-native-community|` +
      `@react-navigation|` +
      `@react-navigation-.*|` +
      `react-redux|` +
      `redux|` +
      `axios` +
    `)/)`
  ],

  // ✅ Resolve @env imports to a mock so Jest doesn't error on env variables
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/@env.js',
  },
};
