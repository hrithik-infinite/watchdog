import { expect, test } from './fixtures';

// Boots the real side-panel bundle in a real Chromium. This is the only place
// the Vite 8 / Rolldown output is executed in a browser (the unit suite runs the
// source via Vitest, not the built chunks), so it catches bundle-level breakage
// — bad chunking, a dynamic import that 404s, a top-level crash — that nothing
// else would.
test.describe('side panel', () => {
  test('boots and renders the scan-ready shell without runtime errors', async ({
    context,
    serviceWorker,
    extensionId,
  }) => {
    // Seed past the first-run onboarding (empty storage → onboarding view) so the
    // home/scan-ready view renders. The background merges this over DEFAULT_SETTINGS.
    await serviceWorker.evaluate(() =>
      chrome.storage.local.set({ watchdog_settings: { hasSeenOnboarding: true } })
    );

    const page = await context.newPage();

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });

    const response = await page.goto(`chrome-extension://${extensionId}/src/sidepanel/index.html`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(200);

    // React mounts into #root — a populated root proves the bundle executed.
    const root = page.locator('#root');
    await expect(root).toBeAttached();
    await expect.poll(() => root.evaluate((el) => el.childElementCount)).toBeGreaterThan(0);

    // The home view is the AuditSelector once onboarding is complete.
    await expect(page.getByText('Choose Audit Types')).toBeVisible();
    await expect(page.getByText('Accessibility', { exact: true })).toBeVisible();

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(
      consoleErrors,
      `console.error output in a clean boot:\n${consoleErrors.join('\n')}`
    ).toEqual([]);
  });
});
