import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BrowserContext, test as base, chromium, type Worker } from '@playwright/test';

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DIST = path.resolve(E2E_DIR, '..', 'dist');

/**
 * Copy the built extension to a temp dir and add `host_permissions` so the
 * harness can inject the content script programmatically from the service
 * worker. The shipped extension grants page access via `activeTab` (a toolbar
 * click), which a headless test cannot perform — granting host access
 * reproduces the *post-grant* state, letting us exercise the real
 * content-script.js + axe engine against a real DOM. The shipped manifest's
 * actual permission model is asserted separately, against unmodified `dist`,
 * in manifest.spec.ts.
 */
function buildTestExtension(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'watchdog-e2e-ext-'));
  cpSync(DIST, dir, { recursive: true });
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.host_permissions = ['http://localhost:*/*'];
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return dir;
}

type Fixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
};

export const test = base.extend<Fixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture signature requires the deps object
  context: async ({}, use) => {
    const extPath = buildTestExtension();
    const context = await chromium.launchPersistentContext('', {
      // `channel: 'chromium'` selects the full build with the new headless mode,
      // the only configuration in which MV3 service workers / extensions load
      // (the default headless-shell cannot host extensions).
      channel: 'chromium',
      args: [
        '--no-sandbox',
        `--disable-extensions-except=${extPath}`,
        `--load-extension=${extPath}`,
      ],
    });
    await use(context);
    await context.close();
    rmSync(extPath, { recursive: true, force: true });
  },

  serviceWorker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent('serviceworker');
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },
});

export const expect = test.expect;
