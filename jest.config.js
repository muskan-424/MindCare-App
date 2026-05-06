module.exports = {
  preset: 'react-native',
  setupFiles: [
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // ✅ Whitelist all native/community packages so Babel can transform them in Jest
  transformIgnorePatterns: [
    `node_modules/(?!(` +
      `jest-react-native|` +
      `react-native|` +
      `@react-native|` +
      `@react-native-community|` +
      `@react-native-async-storage|` +
      `@react-native-ml-kit|` +
      `@react-native-voice|` +
      `@react-navigation|` +
      `react-redux|` +
      `redux|` +
      `axios|` +
      `react-native-paper|` +
      `react-native-vector-icons|` +
      `react-native-vision-camera|` +
      `react-native-audio-recorder-player|` +
      `react-native-gesture-handler|` +
      `react-native-safe-area-context|` +
      `react-native-screens|` +
      `react-native-elements|` +
      `react-native-chart-kit|` +
      `react-native-svg|` +
      `react-native-webview` +
    `)/)`
  ],

  // ✅ Resolve @env imports to a mock so Jest doesn't error on env variables
  moduleNameMapper: {
    '^@env$': '<rootDir>/__mocks__/@env.js',
  },
};
