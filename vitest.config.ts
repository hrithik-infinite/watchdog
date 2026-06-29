import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Count the whole source tree, not just a curated subset — otherwise the
      // background worker, the side-panel components and lib/export.ts never
      // entered the denominator and coverage looked healthier than it was.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/mock-chrome.ts',
        'src/sidepanel/main.tsx',
        '**/*.config.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/__tests__/**',
        'dist/',
      ],
      all: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
