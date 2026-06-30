import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT) || 5599;

// E2E config for the built MV3 extension. Tests load `dist/`, so `npm run build`
// must run first (the test:e2e script chains it). Extensions require a single
// persistent context, so the suite runs serially with one worker.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  webServer: {
    command: 'node e2e/server.mjs',
    // Readiness probe must hit a 200 — Playwright treats a 404 at the root as
    // "not ready". The fixture page always exists, so probe it directly.
    url: `http://localhost:${PORT}/a11y-broken.html`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
