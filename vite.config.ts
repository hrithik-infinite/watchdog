import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import manifest from './manifest.config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), crx({ manifest }), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
   server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
      },
    },
  },
});
