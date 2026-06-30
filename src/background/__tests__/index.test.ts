import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocked dependencies (hoisted so the vi.mock factories can reference them).
const { updateBadge, clearBadge, getSettings, saveSettings } = vi.hoisted(() => ({
  updateBadge: vi.fn(),
  clearBadge: vi.fn(),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));
vi.mock('../badge', () => ({ updateBadge, clearBadge }));
vi.mock('../storage', () => ({ getSettings, saveSettings }));

// Capture the listeners the service worker registers on load.
let messageListener: (msg: unknown, sender: unknown, sendResponse: unknown) => boolean;
let removedListener: (tabId: number) => void;
let updatedListener: (tabId: number, changeInfo: { status?: string }) => void;

// Captured at import time (a plain var, so it survives vi.clearAllMocks()).
let panelBehaviorArg: unknown;
const setPanelBehavior = vi.fn().mockImplementation((arg: unknown) => {
  panelBehaviorArg = arg;
  return Promise.resolve();
});
const sidePanelOpen = vi.fn().mockResolvedValue(undefined);
const tabsQuery = vi.fn().mockResolvedValue([{ id: 7 }]);

vi.stubGlobal('chrome', {
  runtime: {
    onMessage: { addListener: (cb: typeof messageListener) => (messageListener = cb) },
  },
  tabs: {
    query: tabsQuery,
    onRemoved: { addListener: (cb: typeof removedListener) => (removedListener = cb) },
    onUpdated: { addListener: (cb: typeof updatedListener) => (updatedListener = cb) },
  },
  sidePanel: { setPanelBehavior, open: sidePanelOpen },
  action: {},
});

// Importing the worker runs its top-level registration against the mock above.
const { handleMessage } = await import('../index');

describe('background/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue({ wcagLevel: 'AA' });
    tabsQuery.mockResolvedValue([{ id: 7 }]);
  });

  describe('service worker registration', () => {
    it('opens the side panel on action click and registers all listeners', () => {
      expect(panelBehaviorArg).toEqual({ openPanelOnActionClick: true });
      expect(messageListener).toBeTypeOf('function');
      expect(removedListener).toBeTypeOf('function');
      expect(updatedListener).toBeTypeOf('function');
    });

    it('returns true from the message listener (async sendResponse)', () => {
      expect(messageListener({ type: 'GET_SETTINGS' }, {}, vi.fn())).toBe(true);
    });

    // correctness-30 / err-12: the listener's rejection handler used to read
    // `error.message` directly, so a non-Error throwable (here a bare string)
    // produced `error: undefined` instead of a usable message.
    it('serializes non-Error rejections from the listener catch', async () => {
      updateBadge.mockRejectedValueOnce('badge boom');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const sendResponse = vi.fn();
      messageListener(
        { type: 'SCAN_RESULT', payload: { summary: { total: 1 } } },
        { tab: { id: 3 } },
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'badge boom' });
      errorSpy.mockRestore();
    });
  });

  describe('handleMessage routing', () => {
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

    it('opens the side panel for the active tab on OPEN_SIDEPANEL', async () => {
      const res = await handleMessage({ type: 'OPEN_SIDEPANEL' } as never, {} as never);
      expect(sidePanelOpen).toHaveBeenCalledWith({ tabId: 7 });
      expect(res).toEqual({ success: true });
    });

    it('rejects an unknown message type', async () => {
      const res = await handleMessage({ type: 'NOPE' } as never, {} as never);
      expect(res).toEqual({ success: false, error: 'Unknown message type' });
    });
  });

  describe('badge cleanup listeners', () => {
    it('clears the badge when a tab is removed', () => {
      removedListener(42);
      expect(clearBadge).toHaveBeenCalledWith(42);
    });

    it('clears the badge when a tab starts loading, not on other status', () => {
      updatedListener(42, { status: 'loading' });
      expect(clearBadge).toHaveBeenCalledWith(42);

      clearBadge.mockClear();
      updatedListener(42, { status: 'complete' });
      expect(clearBadge).not.toHaveBeenCalled();
    });
  });
});
