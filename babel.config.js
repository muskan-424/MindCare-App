module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',           // ✅ ROOT .env — contains GOOGLE_API_KEY, ADMIN_TOKEN, etc.
      allowUndefined: true
    }],
  ],
};
