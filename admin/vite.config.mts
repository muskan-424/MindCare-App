import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app/translations': path.resolve(__dirname, '../src/localization/translations.js'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
  },
});

