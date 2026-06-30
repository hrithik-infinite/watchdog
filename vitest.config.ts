import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    // Only the Vitest unit suite. The Playwright E2E specs live in e2e/*.spec.ts
    // and import @playwright/test — Vitest's default glob would otherwise try to
    // run them and crash. Keeping this to `*.test.*` under src cleanly separates
    // the two runners.
    include: ['src/**/*.test.{ts,tsx}'],
    // The app logger (src/shared/logger.ts) is gated on import.meta.env.DEV,
    // which Vitest sets to true — so every scanner/hook/background test spews
    // intentional `[WatchDog] …` dev logs that drown the real signal (React
    // act() warnings, deprecations). We can't flip DEV off globally: logger.test
    // asserts it logs in dev. So drop only those prefixed lines at the reporter,
    // leaving genuine warnings intact. (Spied-console assertions are unaffected —
    // onConsoleLog only controls what the reporter prints, not what tests see.)
    onConsoleLog(log) {
      if (log.includes('[WatchDog]')) return false;
    },
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
