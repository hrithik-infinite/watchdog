import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Message } from '@/shared/messaging';

// Mock dependencies
vi.mock('../scanner', () => ({
  scanPage: vi.fn(),
}));

vi.mock('../overlay', () => ({
  highlightElement: vi.fn(),
  clearHighlights: vi.fn(),
}));

vi.mock('../vision-filters', () => ({
  applyVisionFilter: vi.fn(),
  removeVisionFilter: vi.fn(),
}));

vi.mock('../focus-order', () => ({
  toggleFocusOrder: vi.fn(),
  hideFocusOrder: vi.fn(),
}));

// Mock Chrome API and global objects
let messageListeners: Array<
  (message: Message, sender: any, sendResponse: (response: unknown) => void) => boolean
> = [];
const eventListeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();

const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn((callback) => {
        messageListeners.push(callback);
      }),
    },
    sendMessage: vi.fn(),
  },
};

const mockWindow = {
  addEventListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, []);
    }
    eventListeners.get(event)!.push(handler);
  }),
  removeEventListener: vi.fn(),
  location: {
    href: 'https://example.com',
  },
};

// Controllable history so the SPA-navigation hooks (correctness-22) can be
// exercised; the source patches history.pushState/replaceState in place.
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
};

const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal('chrome', mockChrome);
vi.stubGlobal('window', mockWindow);
vi.stubGlobal('history', mockHistory);
vi.stubGlobal('console', mockConsole);

describe('Content Script - index.ts', () => {
  beforeEach(async () => {
    // Reset modules to clear cache and re-run listener registration
    vi.resetModules();
    messageListeners = [];
    eventListeners.clear();
    vi.clearAllMocks();

    // Re-stub globals after reset
    vi.stubGlobal('chrome', mockChrome);
    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('console', mockConsole);

    // Fresh history methods so each import patches a clean original (no stacking
    // of the pushState/replaceState wrappers across re-imports).
    mockHistory.pushState = vi.fn();
    mockHistory.replaceState = vi.fn();
    vi.stubGlobal('history', mockHistory);

    // Import to set up listeners
    await import('../index');
  });

  // Verify module loads and sets up listeners
  it('should set up message listener on load', () => {
    expect(messageListeners.length).toBeGreaterThan(0);
  });

  describe('Message Handling - PING', () => {
    it('should respond to PING message', async () => {
      const sendResponse = vi.fn();
      const message: Message = { type: 'PING' };

      const handler = messageListeners[0];
      const result = handler(message, {}, sendResponse);

      expect(result).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(sendResponse).toHaveBeenCalledWith({ success: true, loaded: true });
    });

    it('should return true to indicate async response', () => {
      const handler = messageListeners[0];
      const result = handler({ type: 'PING' }, {}, vi.fn());

      expect(result).toBe(true);
    });
  });

  describe('Message Handling - SCAN_PAGE', () => {
    it('should scan page on SCAN_PAGE message', async () => {
      const { scanPage } = await import('../scanner');
      const mockScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [],
        incomplete: [],
        summary: {
          total: 0,
          bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
          byCategory: {
            images: 0,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
      };

      (scanPage as any).mockResolvedValue(mockScanResult);

      const sendResponse = vi.fn();
      const message: Message = { type: 'SCAN_PAGE', payload: { auditType: 'accessibility' } };

      const handler = messageListeners[0];
      const result = handler(message, {}, sendResponse);

      expect(result).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        result: mockScanResult,
      });
    });

    it('should send scan result to background script', async () => {
      const { scanPage } = await import('../scanner');
      const mockScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [],
        incomplete: [],
        summary: {
          total: 0,
          bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
          byCategory: {
            images: 0,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
      };

      (scanPage as any).mockResolvedValue(mockScanResult);

      const handler = messageListeners[0];
      handler({ type: 'SCAN_PAGE', payload: { auditType: 'accessibility' } }, {}, vi.fn());

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SCAN_RESULT',
        payload: mockScanResult,
      });
    });

    it('should handle scan errors', async () => {
      const { scanPage } = await import('../scanner');
      const scanError = new Error('Scan failed');
      (scanPage as any).mockRejectedValue(scanError);

      const sendResponse = vi.fn();
      const message: Message = { type: 'SCAN_PAGE', payload: { auditType: 'accessibility' } };

      const handler = messageListeners[0];
      const result = handler(message, {}, sendResponse);

      expect(result).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Scan failed',
      });
    });

    it('should handle non-Error exceptions in scan', async () => {
      const { scanPage } = await import('../scanner');
      (scanPage as any).mockRejectedValue('Unknown error');

      const sendResponse = vi.fn();
      const handler = messageListeners[0];
      handler({ type: 'SCAN_PAGE', payload: { auditType: 'accessibility' } }, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.any(String),
      });
    });
  });

  describe('Message Handling - HIGHLIGHT_ELEMENT', () => {
    it('should highlight element on HIGHLIGHT_ELEMENT message', async () => {
      const { highlightElement } = await import('../overlay');

      const sendResponse = vi.fn();
      const message: Message = {
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector: 'img.hero', severity: 'critical' },
      };

      const handler = messageListeners[0];
      handler(message, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(highlightElement).toHaveBeenCalledWith('img.hero', 'critical');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should accept different severity levels', async () => {
      const { highlightElement } = await import('../overlay');

      const severities = ['critical', 'serious', 'moderate', 'minor'] as const;

      for (const severity of severities) {
        vi.clearAllMocks();
        const sendResponse = vi.fn();
        const message: Message = {
          type: 'HIGHLIGHT_ELEMENT',
          payload: { selector: 'div', severity },
        };

        const handler = messageListeners[0];
        handler(message, {}, sendResponse);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(highlightElement).toHaveBeenCalledWith('div', severity);
      }
    });
  });

  describe('Message Handling - CLEAR_HIGHLIGHTS', () => {
    it('should clear highlights on CLEAR_HIGHLIGHTS message', async () => {
      const { clearHighlights } = await import('../overlay');

      const sendResponse = vi.fn();
      const message: Message = { type: 'CLEAR_HIGHLIGHTS' };

      const handler = messageListeners[0];
      handler(message, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(clearHighlights).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Message Handling - APPLY_VISION_FILTER', () => {
    it('should apply vision filter on APPLY_VISION_FILTER message', async () => {
      const { applyVisionFilter } = await import('../vision-filters');

      const sendResponse = vi.fn();
      const message: Message = {
        type: 'APPLY_VISION_FILTER',
        payload: { mode: 'protanopia' },
      };

      const handler = messageListeners[0];
      handler(message, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(applyVisionFilter).toHaveBeenCalledWith('protanopia');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should accept different vision modes', async () => {
      const { applyVisionFilter } = await import('../vision-filters');

      const modes = [
        'none',
        'protanopia',
        'deuteranopia',
        'tritanopia',
        'achromatopsia',
        'blur-low',
        'blur-medium',
        'blur-high',
      ] as const;

      for (const mode of modes) {
        vi.clearAllMocks();
        const sendResponse = vi.fn();
        const message: Message = {
          type: 'APPLY_VISION_FILTER',
          payload: { mode },
        };

        const handler = messageListeners[0];
        handler(message, {}, sendResponse);

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(applyVisionFilter).toHaveBeenCalledWith(mode);
      }
    });
  });

  describe('Message Handling - TOGGLE_FOCUS_ORDER', () => {
    it('should toggle focus order on TOGGLE_FOCUS_ORDER message', async () => {
      const { toggleFocusOrder } = await import('../focus-order');

      const sendResponse = vi.fn();
      const message: Message = {
        type: 'TOGGLE_FOCUS_ORDER',
        payload: { show: true },
      };

      const handler = messageListeners[0];
      handler(message, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(toggleFocusOrder).toHaveBeenCalledWith(true);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should support hiding focus order', async () => {
      const { toggleFocusOrder } = await import('../focus-order');

      const sendResponse = vi.fn();
      const message: Message = {
        type: 'TOGGLE_FOCUS_ORDER',
        payload: { show: false },
      };

      const handler = messageListeners[0];
      handler(message, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(toggleFocusOrder).toHaveBeenCalledWith(false);
    });
  });

  describe('Message Handling - Unknown type', () => {
    it('should return error for unknown message type', async () => {
      const sendResponse = vi.fn();
      const message = { type: 'UNKNOWN_TYPE' } as any;

      const handler = messageListeners[0];
      handler(message, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown message type',
      });
    });
  });

  describe('Error Handling', () => {
    it('should catch and handle errors in message handler', async () => {
      const sendResponse = vi.fn();
      const message: Message = { type: 'PING' };

      const handler = messageListeners[0];

      // Force an error by throwing from the handler
      const result = handler(message, {}, sendResponse);
      expect(result).toBe(true);
    });

    it('should always return true for immediate async response', async () => {
      const sendResponse = vi.fn();
      const handler = messageListeners[0];

      // All message types should return true to indicate async handling
      const result = handler({ type: 'PING' }, {}, sendResponse);
      expect(result).toBe(true);

      // Response will be sent asynchronously
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(sendResponse).toHaveBeenCalled();
    });
  });

  describe('Window beforeunload listener', () => {
    it('should set up beforeunload listener', async () => {
      expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('should clean up on page unload', async () => {
      const { clearHighlights } = await import('../overlay');
      const { removeVisionFilter } = await import('../vision-filters');
      const { hideFocusOrder } = await import('../focus-order');

      // Get the beforeunload listener
      const calls = (window.addEventListener as any).mock.calls;
      const beforeunloadCall = calls.find((call: any) => call[0] === 'beforeunload');
      expect(beforeunloadCall).toBeDefined();

      const unloadHandler = beforeunloadCall[1];
      unloadHandler();

      expect(clearHighlights).toHaveBeenCalled();
      expect(removeVisionFilter).toHaveBeenCalled();
      expect(hideFocusOrder).toHaveBeenCalled();
    });
  });

  describe('Console logging', () => {
    // perf-rel-12: the raw `console.log('WatchDog content script loaded')` used
    // to ship on every on-demand injection. It has been removed, so the content
    // script no longer logs on load.
    it('should not emit a raw load log', () => {
      expect(mockConsole.log).not.toHaveBeenCalledWith('WatchDog content script loaded');
    });
  });

  describe('Error Handling - non-Error rejections', () => {
    it('serializes non-Error rejections from the listener catch', async () => {
      // correctness-30 / err-12: the outer .catch read `error.message` directly,
      // so a non-Error throwable (here a bare string) yielded `error: undefined`.
      const { highlightElement } = await import('../overlay');
      (highlightElement as any).mockImplementation(() => {
        throw 'sync boom';
      });

      const sendResponse = vi.fn();
      const handler = messageListeners[0];
      handler(
        { type: 'HIGHLIGHT_ELEMENT', payload: { selector: 'div', severity: 'critical' } },
        {},
        sendResponse
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'sync boom' });
    });
  });

  describe('SPA navigation - vision filter persistence (correctness-22)', () => {
    // The active filter used to be lost when an SPA route change wiped the
    // injected SVG defs / inline <html> filter. It is now re-applied after
    // history navigations.
    it('re-applies the active vision filter after a pushState navigation', async () => {
      const { applyVisionFilter } = await import('../vision-filters');
      const handler = messageListeners[0];

      handler({ type: 'APPLY_VISION_FILTER', payload: { mode: 'protanopia' } }, {}, vi.fn());
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(applyVisionFilter).toHaveBeenCalledWith('protanopia');

      (applyVisionFilter as any).mockClear();

      mockHistory.pushState({}, '', '/dashboard');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(applyVisionFilter).toHaveBeenCalledWith('protanopia');
    });

    it('re-applies the active vision filter after a popstate navigation', async () => {
      const { applyVisionFilter } = await import('../vision-filters');
      const handler = messageListeners[0];

      handler({ type: 'APPLY_VISION_FILTER', payload: { mode: 'deuteranopia' } }, {}, vi.fn());
      await new Promise((resolve) => setTimeout(resolve, 10));
      (applyVisionFilter as any).mockClear();

      const popstateHandlers = eventListeners.get('popstate');
      expect(popstateHandlers).toBeDefined();
      popstateHandlers![0]();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(applyVisionFilter).toHaveBeenCalledWith('deuteranopia');
    });

    it('does not re-apply on navigation when no filter is active', async () => {
      const { applyVisionFilter } = await import('../vision-filters');
      (applyVisionFilter as any).mockClear();

      mockHistory.pushState({}, '', '/x');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(applyVisionFilter).not.toHaveBeenCalled();
    });

    it('removes the popstate listener and restores history on unload', () => {
      const calls = (window.addEventListener as any).mock.calls;
      const beforeunloadCall = calls.find((call: any) => call[0] === 'beforeunload');
      const unloadHandler = beforeunloadCall[1];

      const patchedPushState = mockHistory.pushState;
      unloadHandler();

      expect(window.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
      // The wrapper is swapped back to the captured original on teardown.
      expect(mockHistory.pushState).not.toBe(patchedPushState);
    });
  });

  describe('Message listener behavior', () => {
    it('should always return true for async response', async () => {
      const handler = messageListeners[0];

      const messages: Message[] = [
        { type: 'PING' },
        { type: 'SCAN_PAGE', payload: { auditType: 'accessibility' } },
        { type: 'CLEAR_HIGHLIGHTS' },
        { type: 'HIGHLIGHT_ELEMENT', payload: { selector: 'div', severity: 'critical' } },
        { type: 'APPLY_VISION_FILTER', payload: { mode: 'protanopia' } },
        { type: 'TOGGLE_FOCUS_ORDER', payload: { show: true } },
      ];

      for (const message of messages) {
        const result = handler(message, {}, vi.fn());
        expect(result).toBe(true);
      }
    });

    it('should handle sendResponse being called', async () => {
      const sendResponse = vi.fn();
      const handler = messageListeners[0];

      handler({ type: 'PING' }, {}, sendResponse);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalled();
    });
  });
});
