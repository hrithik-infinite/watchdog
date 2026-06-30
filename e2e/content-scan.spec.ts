import { expect, test } from './fixtures';

const FIXTURE_URL = `http://localhost:${process.env.E2E_PORT || 5599}/a11y-broken.html`;

type ScanResponse = {
  success: boolean;
  error?: string;
  result?: { issues: Array<{ ruleId: string }>; summary: { total: number } };
};

// Injects the real built content-script.js into a real page and runs the real
// axe engine against a real DOM — the end-to-end path the unit suite cannot
// cover because it mocks axe-core. Proves the injection contract (executeScript
// + PING/SCAN_PAGE messaging) and that the shipped scanner reports the expected
// violations.
test.describe('content script scan', () => {
  test('injects, scans a broken page, and reports the expected violations', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(FIXTURE_URL, { waitUntil: 'load' });

    // Drive the production injection path from the service worker, exactly as
    // ensureContentScript() does: executeScript the bundle, then SCAN_PAGE.
    const scan = (await serviceWorker.evaluate(async (url): Promise<ScanResponse> => {
      const [tab] = await chrome.tabs.query({ url });
      if (!tab?.id) return { success: false, error: 'fixture tab not found' };
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js'],
      });
      return (await chrome.tabs.sendMessage(tab.id, {
        type: 'SCAN_PAGE',
        payload: { auditType: 'accessibility' },
      })) as ScanResponse;
    }, FIXTURE_URL)) as ScanResponse;

    expect(scan.success, scan.error).toBe(true);
    expect(scan.result).toBeTruthy();

    const ruleIds = new Set((scan.result?.issues ?? []).map((i) => i.ruleId));
    // Each maps to a planted violation in e2e/pages/a11y-broken.html.
    expect(ruleIds).toContain('image-alt');
    expect(ruleIds).toContain('button-name');
    expect(ruleIds).toContain('link-name');
    expect(ruleIds).toContain('label');
    expect(scan.result?.summary.total).toBeGreaterThanOrEqual(4);
  });

  test('PING confirms the script is loaded after injection', async ({ context, serviceWorker }) => {
    const page = await context.newPage();
    await page.goto(FIXTURE_URL, { waitUntil: 'load' });

    const pong = await serviceWorker.evaluate(async (url) => {
      const [tab] = await chrome.tabs.query({ url });
      if (!tab?.id) return null;
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js'],
      });
      return chrome.tabs.sendMessage(tab.id, { type: 'PING' });
    }, FIXTURE_URL);

    expect(pong).toEqual({ success: true, loaded: true });
  });
});
