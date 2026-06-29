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
      // Regression gate: `npm test` (run with --coverage, and so CI) fails if
      // coverage drops below these floors. Set ~1-2% under the current honest
      // baseline (stmts 79.2 / branch 68.8 / funcs 74.8 / lines 79.5) so a real
      // drop is caught without breaking on normal fluctuation. Raise as coverage
      // improves; never lower to make a red build pass.
      thresholds: {
        statements: 78,
        branches: 67,
        functions: 73,
        lines: 78,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
