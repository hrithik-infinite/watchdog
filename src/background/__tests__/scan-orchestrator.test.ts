import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, Issue, ScanResult, Severity } from '@/shared/types';

// Mock the orchestrator's collaborators: the armed tab, the badge, and injection.
const { getArmedTab, updateBadge, ensureContentScript } = vi.hoisted(() => ({
  getArmedTab: vi.fn(),
  updateBadge: vi.fn(() => Promise.resolve()),
  ensureContentScript: vi.fn(() => Promise.resolve()),
}));
vi.mock('../armed-tab', () => ({ getArmedTab }));
vi.mock('../badge', () => ({ updateBadge }));
vi.mock('@/shared/inject', () => ({ ensureContentScript }));

const tabsSendMessage = vi.fn();
const runtimeSendMessage = vi.fn(() => Promise.resolve());
vi.stubGlobal('chrome', {
  tabs: { sendMessage: tabsSendMessage },
  runtime: { sendMessage: runtimeSendMessage },
});

const { runScan, NO_ARMED_TAB_MESSAGE } = await import('../scan-orchestrator');

// Build a content-script ScanResult with one issue of the given severity/category.
function makeResult(overrides: Partial<ScanResult> = {}): ScanResult {
  const issue: Issue = {
    id: 'issue-1',
    ruleId: 'image-alt',
    severity: 'critical' as Severity,
    category: 'images' as Category,
    message: 'Images must have alt text',
    description: 'desc',
    helpUrl: 'https://example.com/help',
    wcag: { id: '1.1.1', level: 'A', name: 'Non-text Content', description: 'd' },
    element: { selector: 'img.hero', html: '<img>' },
    fix: { description: 'Add alt', code: '<img alt="x">', learnMoreUrl: 'https://x' },
  };
  return {
    url: 'https://example.com',
    timestamp: 1_700_000_000,
    duration: 50,
    issues: [issue],
    incomplete: [],
    summary: {
      total: 1,
      bySeverity: { critical: 1, serious: 0, moderate: 0, minor: 0 },
      byCategory: {
        images: 1,
        interactive: 0,
        forms: 0,
        color: 0,
        document: 0,
        structure: 0,
        aria: 0,
        technical: 0,
      },
    },
    ...overrides,
  };
}

describe('scan-orchestrator runScan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getArmedTab.mockResolvedValue({ id: 7, url: 'https://example.com/page' });
    tabsSendMessage.mockResolvedValue({ success: true, result: makeResult() });
  });

  describe('guards', () => {
    it('throws the no-armed-tab message when nothing is armed', async () => {
      getArmedTab.mockResolvedValue(null);
      await expect(runScan(['accessibility'], new AbortController().signal)).rejects.toThrow(
        NO_ARMED_TAB_MESSAGE
      );
      expect(ensureContentScript).not.toHaveBeenCalled();
    });

    it('rejects browser-internal pages (now that the URL is readable)', async () => {
      getArmedTab.mockResolvedValue({ id: 7, url: 'chrome://extensions' });
      await expect(runScan(['accessibility'], new AbortController().signal)).rejects.toThrow(
        'internal pages'
      );
    });

    it.each([
      ['https://chromewebstore.google.com/detail/abc', 'Chrome Web Store'],
      ['view-source:https://example.com', 'view-source'],
      ['https://example.com/report.pdf', 'PDF'],
      ['file:///Users/me/index.html', 'local files'],
    ])('rejects the unscannable page %s', async (url, fragment) => {
      getArmedTab.mockResolvedValue({ id: 7, url });
      await expect(runScan(['accessibility'], new AbortController().signal)).rejects.toThrow(
        fragment
      );
      expect(ensureContentScript).not.toHaveBeenCalled();
    });
  });

  describe('single audit', () => {
    it('injects, sends SCAN_PAGE, sets the badge, and returns the content result', async () => {
      const result = makeResult();
      tabsSendMessage.mockResolvedValue({ success: true, result });

      const outcome = await runScan(['accessibility'], new AbortController().signal);

      expect(ensureContentScript).toHaveBeenCalledWith(7);
      expect(tabsSendMessage).toHaveBeenCalledWith(7, {
        type: 'SCAN_PAGE',
        payload: { auditType: 'accessibility' },
      });
      expect(updateBadge).toHaveBeenCalledWith(7, 1);
      expect(outcome).toEqual({ result });
    });

    it('throws the content script error when the audit fails', async () => {
      tabsSendMessage.mockResolvedValue({ success: false, error: 'axe boom' });
      await expect(runScan(['accessibility'], new AbortController().signal)).rejects.toThrow(
        'axe boom'
      );
    });
  });

  describe('multi audit', () => {
    it('runs each audit, tags issue ids, combines, streams progress, and badges the total', async () => {
      tabsSendMessage
        .mockResolvedValueOnce({ success: true, result: makeResult() })
        .mockResolvedValueOnce({
          success: true,
          result: makeResult({
            issues: [
              {
                ...makeResult().issues[0],
                id: 'issue-2',
                severity: 'moderate' as Severity,
                category: 'structure' as Category,
              },
            ],
          }),
        });

      const outcome = await runScan(['accessibility', 'seo'], new AbortController().signal);

      // Two SCAN_PAGE calls, in order.
      expect(tabsSendMessage).toHaveBeenNthCalledWith(1, 7, {
        type: 'SCAN_PAGE',
        payload: { auditType: 'accessibility' },
      });
      expect(tabsSendMessage).toHaveBeenNthCalledWith(2, 7, {
        type: 'SCAN_PAGE',
        payload: { auditType: 'seo' },
      });
      // Issue ids are prefixed by audit type in the combined result.
      expect(outcome.result.issues.map((i) => i.id)).toEqual([
        'accessibility-issue-1',
        'seo-issue-2',
      ]);
      expect(outcome.result.summary.total).toBe(2);
      expect(outcome.result.url).toBe('https://example.com/page');
      expect(outcome.partialError).toBeUndefined();
      expect(updateBadge).toHaveBeenCalledWith(7, 2);
      // Progress streamed once per audit.
      expect(runtimeSendMessage).toHaveBeenCalledWith({
        type: 'SCAN_PROGRESS',
        payload: { index: 0, total: 2, auditType: 'accessibility' },
      });
      expect(runtimeSendMessage).toHaveBeenCalledWith({
        type: 'SCAN_PROGRESS',
        payload: { index: 1, total: 2, auditType: 'seo' },
      });
    });

    it('keeps successful audits and reports a partial failure', async () => {
      tabsSendMessage
        .mockResolvedValueOnce({ success: true, result: makeResult() })
        .mockResolvedValueOnce({ success: false, error: 'pwa boom' });

      const outcome = await runScan(['accessibility', 'pwa'], new AbortController().signal);

      expect(outcome.result.summary.total).toBe(1);
      expect(outcome.partialError).toContain('pwa');
      expect(updateBadge).toHaveBeenCalledWith(7, 1);
    });

    it('throws when every audit fails', async () => {
      tabsSendMessage.mockResolvedValue({ success: false, error: 'boom' });
      await expect(runScan(['accessibility', 'seo'], new AbortController().signal)).rejects.toThrow(
        'All audits failed'
      );
      expect(updateBadge).not.toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('rejects a hung audit when the signal aborts', async () => {
      // A real cancellation interrupts a page that never responds; model that with
      // a sendMessage that never resolves so the abort wins the race.
      tabsSendMessage.mockReturnValue(new Promise(() => {}));
      const controller = new AbortController();
      controller.abort();
      await expect(runScan(['accessibility'], controller.signal)).rejects.toThrow('cancelled');
    });
  });
});
