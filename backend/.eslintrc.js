module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script', // CommonJS (require/module.exports)
  },
  extends: ['eslint:recommended'],
  rules: {
    // Server logging is expected.
    'no-console': 'off',
    // Allow intentionally-unused args/vars prefixed with underscore.
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  ignorePatterns: ['node_modules/', 'scripts/'],
};
