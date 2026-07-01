import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Dev-only preview ("UX gallery") of the side-panel UI. Renders the REAL
// components with mock data in a normal browser — no CRXJS, no chrome runtime —
// so the UX can be reviewed without loading the unpacked extension.
//
// Fully isolated from the extension build: the production `vite build`
// (vite.config.ts) never references gallery.html or gallery/, and this config is
// only invoked via `npm run preview:ux`. It is never bundled into dist/.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5180,
    open: '/gallery.html',
  },
});
