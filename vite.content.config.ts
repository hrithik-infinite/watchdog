import { defineConfig } from 'vite';
import { resolve } from 'path';

// Second build step (run after the main CRXJS build) that bundles the content
// script as a single self-contained IIFE at a stable path. This lets us inject
// it on demand via chrome.scripting.executeScript({ files: ['content-script.js'] })
// instead of declaring an `<all_urls>` content script — which is the only thing
// that triggers Chrome's "read and change all your data on all websites" install
// warning (secpriv-6). `emptyOutDir: false` preserves the main build's output;
// `inlineDynamicImports` + `cssCodeSplit: false` produce exactly two files:
// content-script.js and content-script.css.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'content-script.js',
        assetFileNames: 'content-script.[ext]',
        inlineDynamicImports: true,
      },
    },
  },
});
