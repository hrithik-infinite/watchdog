import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocked dependencies (hoisted so the vi.mock factories can reference them).
const {
  updateBadge,
  clearBadge,
  getSettings,
  saveSettings,
  armTab,
  disarmTab,
  getArmedTab,
  runScan,
  ensureContentScript,
} = vi.hoisted(() => ({
  updateBadge: vi.fn(),
  clearBadge: vi.fn(),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  armTab: vi.fn(() => Promise.resolve()),
  disarmTab: vi.fn(() => Promise.resolve()),
  getArmedTab: vi.fn(),
  runScan: vi.fn(),
  ensureContentScript: vi.fn(() => Promise.resolve()),
}));
vi.mock('../badge', () => ({ updateBadge, clearBadge }));
vi.mock('../storage', () => ({ getSettings, saveSettings }));
vi.mock('../armed-tab', () => ({ armTab, disarmTab, getArmedTab }));
vi.mock('../scan-orchestrator', () => ({
  runScan,
  NO_ARMED_TAB_MESSAGE:
    'Click the WatchDog toolbar icon on the page you want to scan, then scan again.',
}));
vi.mock('@/shared/inject', () => ({ ensureContentScript }));

// Capture the listeners the service worker registers on load.
let messageListener: (msg: unknown, sender: unknown, sendResponse: unknown) => boolean;
let removedListener: (tabId: number) => void;
let updatedListener: (tabId: number, changeInfo: { status?: string }) => void;
let actionClickedListener: (tab: unknown) => void;

const sidePanelOpen = vi.fn().mockResolvedValue(undefined);
const tabsSendMessage = vi.fn().mockResolvedValue({ success: true });
const tabsGet = vi.fn();

vi.stubGlobal('chrome', {
  runtime: {
    id: 'watchdog-test',
    onMessage: { addListener: (cb: typeof messageListener) => (messageListener = cb) },
  },
  tabs: {
    get: tabsGet,
    sendMessage: tabsSendMessage,
    onRemoved: { addListener: (cb: typeof removedListener) => (removedListener = cb) },
    onUpdated: { addListener: (cb: typeof updatedListener) => (updatedListener = cb) },
  },
  action: {
    onClicked: { addListener: (cb: typeof actionClickedListener) => (actionClickedListener = cb) },
  },
  sidePanel: { open: sidePanelOpen },
});

// Importing the worker runs its top-level registration against the mock above.
const { handleMessage } = await import('../index');

describe('background/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({ wcagLevel: 'AA' });
    getArmedTab.mockResolvedValue({ id: 5, url: 'https://example.com' });
  });

  describe('service worker registration', () => {
    it('registers the action-click, message, and tab listeners', () => {
      expect(actionClickedListener).toBeTypeOf('function');
      expect(messageListener).toBeTypeOf('function');
      expect(removedListener).toBeTypeOf('function');
      expect(updatedListener).toBeTypeOf('function');
    });

    it('returns true from the message listener (async sendResponse)', () => {
      expect(messageListener({ type: 'GET_SETTINGS' }, { id: 'watchdog-test' }, vi.fn())).toBe(
        true
      );
    });

    it('ignores messages from a foreign sender (defense-in-depth)', () => {
      const sendResponse = vi.fn();
      expect(messageListener({ type: 'GET_SETTINGS' }, { id: 'someone-else' }, sendResponse)).toBe(
        false
      );
      expect(getSettings).not.toHaveBeenCalled();
    });

    // correctness-30 / err-12: the listener's rejection handler used to read
    // `error.message` directly, so a non-Error throwable produced `error: undefined`.
    it('serializes non-Error rejections from the listener catch', async () => {
      updateBadge.mockRejectedValueOnce('badge boom');
      const sendResponse = vi.fn();
      messageListener(
        { type: 'SCAN_RESULT', payload: { summary: { total: 1 } } },
        { id: 'watchdog-test', tab: { id: 3 } },
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'badge boom' });
    });
  });

  describe('action.onClicked (arm + open)', () => {
    it('opens the side panel for the window and arms the clicked tab', async () => {
      actionClickedListener({ id: 5, windowId: 2, url: 'https://example.com/page' });
      // sidePanel.open must fire synchronously (before any await) to keep the gesture.
      expect(sidePanelOpen).toHaveBeenCalledWith({ windowId: 2 });
      // Arming is async; let it settle.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(armTab).toHaveBeenCalledWith({ id: 5, url: 'https://example.com/page' });
      // url was on the tab arg, so no extra chrome.tabs.get lookup was needed.
      expect(tabsGet).not.toHaveBeenCalled();
    });

    it('resolves the url via chrome.tabs.get when the click arg lacks it', async () => {
      tabsGet.mockResolvedValueOnce({ id: 9, url: 'https://resolved.example' });
      actionClickedListener({ id: 9, windowId: 1 });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(tabsGet).toHaveBeenCalledWith(9);
      expect(armTab).toHaveBeenCalledWith({ id: 9, url: 'https://resolved.example' });
    });
  });

  describe('handleMessage routing', () => {
    it('runs the orchestrator for SCAN_REQUEST and returns its result', async () => {
      const result = { url: 'https://example.com', summary: { total: 3 } };
      runScan.mockResolvedValueOnce({ result });
      const res = await handleMessage(
        { type: 'SCAN_REQUEST', payload: { auditTypes: ['accessibility'] } } as never,
        {} as never
      );
      expect(runScan).toHaveBeenCalledWith(['accessibility'], expect.any(AbortSignal));
      expect(res).toEqual({ success: true, result, error: undefined });
    });

    it('surfaces a partial multi-scan failure as success + banner', async () => {
      const result = { url: 'https://example.com', summary: { total: 3 } };
      runScan.mockResolvedValueOnce({ result, partialError: 'Some audits failed: pwa: boom' });
      const res = await handleMessage(
        { type: 'SCAN_REQUEST', payload: { auditTypes: ['accessibility', 'pwa'] } } as never,
        {} as never
      );
      expect(res).toEqual({ success: true, result, error: 'Some audits failed: pwa: boom' });
    });

    it('returns a friendly error when the orchestrator throws', async () => {
      runScan.mockRejectedValueOnce(new Error('Cannot scan browser internal pages'));
      const res = await handleMessage(
        { type: 'SCAN_REQUEST', payload: { auditTypes: ['seo'] } } as never,
        {} as never
      );
      expect(res).toEqual({ success: false, error: 'Cannot scan browser internal pages' });
    });

    it('reports cancellation when CANCEL_SCAN aborts an in-flight scan', async () => {
      // runScan hangs until its signal aborts, mimicking a real scan.
      runScan.mockImplementationOnce(
        (_types: unknown, signal: AbortSignal) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(new Error('Scan cancelled')));
          })
      );
      const scanPromise = handleMessage(
        { type: 'SCAN_REQUEST', payload: { auditTypes: ['accessibility'] } } as never,
        {} as never
      );
      const cancelRes = await handleMessage({ type: 'CANCEL_SCAN' } as never, {} as never);
      expect(cancelRes).toEqual({ success: true });
      expect(await scanPromise).toEqual({ success: false, cancelled: true });
    });

    it('resolves the armed tab for GET_ARMED_TAB', async () => {
      const res = await handleMessage({ type: 'GET_ARMED_TAB' } as never, {} as never);
      expect(res).toEqual({ success: true, tab: { id: 5, url: 'https://example.com' } });
    });

    it('forwards a page-op to the armed tab after ensuring the content script', async () => {
      const message = { type: 'APPLY_VISION_FILTER', payload: { mode: 'protanopia' } };
      const res = await handleMessage(message as never, {} as never);
      expect(ensureContentScript).toHaveBeenCalledWith(5);
      expect(tabsSendMessage).toHaveBeenCalledWith(5, message);
      expect(res).toEqual({ success: true });
    });

    it('reports the no-armed-tab error for a page-op when nothing is armed', async () => {
      getArmedTab.mockResolvedValueOnce(null);
      const res = await handleMessage({ type: 'CLEAR_HIGHLIGHTS' } as never, {} as never);
      expect(ensureContentScript).not.toHaveBeenCalled();
      expect(res).toEqual({
        success: false,
        error: 'Click the WatchDog toolbar icon on the page you want to scan, then scan again.',
      });
    });

    it('updates the badge from a SCAN_RESULT carrying a tab id', async () => {
      const res = await handleMessage(
        { type: 'SCAN_RESULT', payload: { summary: { total: 8 } } } as never,
        { tab: { id: 9 } } as never
      );
      expect(updateBadge).toHaveBeenCalledWith(9, 8);
      expect(res).toEqual({ success: true });
    });

    it('skips the badge when SCAN_RESULT has no tab id', async () => {
      const res = await handleMessage(
        { type: 'SCAN_RESULT', payload: { summary: { total: 8 } } } as never,
        {} as never
      );
      expect(updateBadge).not.toHaveBeenCalled();
      expect(res).toEqual({ success: true });
    });

    it('returns settings for GET_SETTINGS', async () => {
      const res = await handleMessage({ type: 'GET_SETTINGS' } as never, {} as never);
      expect(getSettings).toHaveBeenCalled();
      expect(res).toEqual({ success: true, settings: { wcagLevel: 'AA' } });
    });

    it('persists the patch for UPDATE_SETTINGS', async () => {
      const res = await handleMessage(
        { type: 'UPDATE_SETTINGS', payload: { persona: 'developer' } } as never,
        {} as never
      );
      expect(saveSettings).toHaveBeenCalledWith({ persona: 'developer' });
      expect(res).toEqual({ success: true });
    });

    it('sets the badge to an explicit tab + count on SET_BADGE (correctness-5)', async () => {
      const res = await handleMessage(
        { type: 'SET_BADGE', payload: { tabId: 4, count: 12 } } as never,
        {} as never
      );
      expect(updateBadge).toHaveBeenCalledWith(4, 12);
      expect(res).toEqual({ success: true });
    });

    it('rejects an unknown message type', async () => {
      const res = await handleMessage({ type: 'NOPE' } as never, {} as never);
      expect(res).toEqual({ success: false, error: 'Unknown message type' });
    });
  });

  describe('tab lifecycle listeners', () => {
    it('clears the badge and disarms the tab when it is removed', () => {
      removedListener(42);
      expect(clearBadge).toHaveBeenCalledWith(42);
      expect(disarmTab).toHaveBeenCalledWith(42);
    });

    it('clears the badge and disarms on loading, but not on other status', () => {
      updatedListener(42, { status: 'loading' });
      expect(clearBadge).toHaveBeenCalledWith(42);
      expect(disarmTab).toHaveBeenCalledWith(42);

      clearBadge.mockClear();
      disarmTab.mockClear();
      updatedListener(42, { status: 'complete' });
      expect(clearBadge).not.toHaveBeenCalled();
      expect(disarmTab).not.toHaveBeenCalled();
    });
  });
});
