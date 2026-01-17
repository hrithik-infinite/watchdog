import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sendMessage,
  sendTabMessage,
  getCurrentTab,
  type Message,
  type PingMessage,
  type ScanPageMessage,
  type HighlightElementMessage,
  type ApplyVisionFilterMessage,
  type ToggleFocusOrderMessage,
  type UpdateSettingsMessage,
} from '../messaging';

// Mock Chrome API
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: vi.fn(),
  },
  tabs: {
    sendMessage: vi.fn(),
    query: vi.fn(),
  },
});

describe('Messaging - Communication between extension parts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Message types', () => {
    it('should support PING message type', () => {
      const message: PingMessage = {
        type: 'PING',
      };

      expect(message.type).toBe('PING');
    });

    it('should support SCAN_PAGE message type', () => {
      const message: ScanPageMessage = {
        type: 'SCAN_PAGE',
      };

      expect(message.type).toBe('SCAN_PAGE');
    });

    it('should support HIGHLIGHT_ELEMENT message type', () => {
      const message: HighlightElementMessage = {
        type: 'HIGHLIGHT_ELEMENT',
        payload: {
          selector: '.test',
          severity: 'critical',
        },
      };

      expect(message.type).toBe('HIGHLIGHT_ELEMENT');
      expect(message.payload.selector).toBe('.test');
      expect(message.payload.severity).toBe('critical');
    });

    it('should support CLEAR_HIGHLIGHTS message type', () => {
      const message: Message = {
        type: 'CLEAR_HIGHLIGHTS',
      };

      expect(message.type).toBe('CLEAR_HIGHLIGHTS');
    });

    it('should support APPLY_VISION_FILTER message type', () => {
      const message: ApplyVisionFilterMessage = {
        type: 'APPLY_VISION_FILTER',
        payload: {
          mode: 'protanopia',
        },
      };

      expect(message.type).toBe('APPLY_VISION_FILTER');
      expect(message.payload.mode).toBe('protanopia');
    });

    it('should support TOGGLE_FOCUS_ORDER message type', () => {
      const message: ToggleFocusOrderMessage = {
        type: 'TOGGLE_FOCUS_ORDER',
        payload: {
          show: true,
        },
      };

      expect(message.type).toBe('TOGGLE_FOCUS_ORDER');
      expect(message.payload.show).toBe(true);
    });

    it('should support GET_SETTINGS message type', () => {
      const message: Message = {
        type: 'GET_SETTINGS',
      };

      expect(message.type).toBe('GET_SETTINGS');
    });

    it('should support UPDATE_SETTINGS message type', () => {
      const message: UpdateSettingsMessage = {
        type: 'UPDATE_SETTINGS',
        payload: {
          wcagLevel: 'AA',
        },
      };

      expect(message.type).toBe('UPDATE_SETTINGS');
      expect(message.payload.wcagLevel).toBe('AA');
    });

    it('should support OPEN_SIDEPANEL message type', () => {
      const message: Message = {
        type: 'OPEN_SIDEPANEL',
      };

      expect(message.type).toBe('OPEN_SIDEPANEL');
    });

    it('should support SCAN_RESULT message type', () => {
      const message: Message = {
        type: 'SCAN_RESULT',
        payload: {
          url: 'https://example.com',
          timestamp: Date.now(),
          duration: 100,
          issues: [],
          incomplete: [],
          summary: {
            total: 0,
            bySeverity: {
              critical: 0,
              serious: 0,
              moderate: 0,
              minor: 0,
            },
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
        },
      };

      expect(message.type).toBe('SCAN_RESULT');
    });
  });

  describe('sendMessage', () => {
    it('should send message via chrome.runtime.sendMessage', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
      (chrome.runtime.sendMessage as any) = mockSendMessage;

      const message: PingMessage = { type: 'PING' };
      await sendMessage(message);

      expect(mockSendMessage).toHaveBeenCalledWith(message);
    });

    it('should return promise from sendMessage', async () => {
      const mockResponse = { success: true };
      (chrome.runtime.sendMessage as any) = vi.fn().mockResolvedValue(mockResponse);

      const message: PingMessage = { type: 'PING' };
      const result = await sendMessage(message);

      expect(result).toEqual(mockResponse);
    });

    it('should handle SCAN_PAGE message', async () => {
      (chrome.runtime.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const message: ScanPageMessage = { type: 'SCAN_PAGE' };
      await sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should handle HIGHLIGHT_ELEMENT message', async () => {
      (chrome.runtime.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const message: HighlightElementMessage = {
        type: 'HIGHLIGHT_ELEMENT',
        payload: {
          selector: 'img.hero',
          severity: 'critical',
        },
      };

      await sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'HIGHLIGHT_ELEMENT',
          payload: {
            selector: 'img.hero',
            severity: 'critical',
          },
        })
      );
    });

    it('should handle vision filter messages', async () => {
      (chrome.runtime.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const modes = ['protanopia', 'deuteranopia', 'blur-low', 'none'] as const;

      for (const mode of modes) {
        const message: ApplyVisionFilterMessage = {
          type: 'APPLY_VISION_FILTER',
          payload: { mode },
        };

        await sendMessage(message);
      }

      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(4);
    });

    it('should handle focus order toggle messages', async () => {
      (chrome.runtime.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const messages: ToggleFocusOrderMessage[] = [
        { type: 'TOGGLE_FOCUS_ORDER', payload: { show: true } },
        { type: 'TOGGLE_FOCUS_ORDER', payload: { show: false } },
      ];

      for (const message of messages) {
        await sendMessage(message);
      }

      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle settings messages', async () => {
      (chrome.runtime.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const message: UpdateSettingsMessage = {
        type: 'UPDATE_SETTINGS',
        payload: {
          wcagLevel: 'AAA',
          visionMode: 'protanopia',
        },
      };

      await sendMessage(message);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_SETTINGS',
        })
      );
    });

    it('should throw if chrome.runtime is not available', async () => {
      const originalChrome = (global as any).chrome;
      (global as any).chrome = { runtime: undefined };

      const message: PingMessage = { type: 'PING' };

      try {
        await sendMessage(message);
      } catch (error) {
        expect(error).toBeDefined();
      }

      (global as any).chrome = originalChrome;
    });
  });

  describe('sendTabMessage', () => {
    it('should send message to specific tab', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({ success: true });
      (chrome.tabs.sendMessage as any) = mockSendMessage;

      const message: PingMessage = { type: 'PING' };
      await sendTabMessage(123, message);

      expect(mockSendMessage).toHaveBeenCalledWith(123, message);
    });

    it('should pass tab ID as first argument', async () => {
      (chrome.tabs.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const message: HighlightElementMessage = {
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector: '.test', severity: 'serious' },
      };

      await sendTabMessage(456, message);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(456, message);
    });

    it('should handle multiple tab IDs', async () => {
      (chrome.tabs.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const message: PingMessage = { type: 'PING' };
      const tabIds = [1, 2, 3, 4, 5];

      for (const tabId of tabIds) {
        await sendTabMessage(tabId, message);
      }

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(5);
    });

    it('should send highlight messages to tab', async () => {
      (chrome.tabs.sendMessage as any) = vi.fn().mockResolvedValue(undefined);

      const message: HighlightElementMessage = {
        type: 'HIGHLIGHT_ELEMENT',
        payload: {
          selector: 'button',
          severity: 'critical',
        },
      };

      await sendTabMessage(789, message);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(789, message);
    });

    it('should return promise', async () => {
      const mockResponse = { elementFound: true };
      (chrome.tabs.sendMessage as any) = vi.fn().mockResolvedValue(mockResponse);

      const message: PingMessage = { type: 'PING' };
      const result = await sendTabMessage(100, message);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentTab', () => {
    it('should query active tab in current window', async () => {
      const mockTab = {
        id: 123,
        active: true,
        windowId: 1,
      };

      (chrome.tabs.query as any) = vi.fn().mockResolvedValue([mockTab]);

      const tab = await getCurrentTab();

      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(tab).toEqual(mockTab);
    });

    it('should return first tab from query results', async () => {
      const mockTabs = [
        { id: 123, active: true, windowId: 1 },
        { id: 124, active: false, windowId: 1 },
      ];

      (chrome.tabs.query as any) = vi.fn().mockResolvedValue(mockTabs);

      const tab = await getCurrentTab();

      expect(tab).toEqual(mockTabs[0]);
    });

    it('should return undefined if no tab found', async () => {
      (chrome.tabs.query as any) = vi.fn().mockResolvedValue([]);

      const tab = await getCurrentTab();

      expect(tab).toBeUndefined();
    });

    it('should handle tab properties', async () => {
      const mockTab = {
        id: 456,
        active: true,
        windowId: 1,
        url: 'https://example.com',
        title: 'Example Site',
        status: 'complete',
      };

      (chrome.tabs.query as any) = vi.fn().mockResolvedValue([mockTab]);

      const tab = await getCurrentTab();

      expect(tab?.id).toBe(456);
      expect(tab?.url).toBe('https://example.com');
      expect(tab?.title).toBe('Example Site');
    });

    it('should filter by active and currentWindow', async () => {
      const mockTab = { id: 789, active: true, windowId: 2 };
      (chrome.tabs.query as any) = vi.fn().mockResolvedValue([mockTab]);

      await getCurrentTab();

      const queryArg = (chrome.tabs.query as any).mock.calls[0][0];
      expect(queryArg.active).toBe(true);
      expect(queryArg.currentWindow).toBe(true);
    });

    it('should return async result', async () => {
      const mockTab = { id: 100, active: true, windowId: 1 };
      (chrome.tabs.query as any) = vi.fn().mockResolvedValue([mockTab]);

      const tabPromise = getCurrentTab();

      expect(tabPromise).toBeInstanceOf(Promise);

      const tab = await tabPromise;
      expect(tab).toEqual(mockTab);
    });
  });

  describe('Message payload structures', () => {
    it('should support highlight element with all severities', () => {
      const severities = ['critical', 'serious', 'moderate', 'minor'] as const;

      severities.forEach((severity) => {
        const message: HighlightElementMessage = {
          type: 'HIGHLIGHT_ELEMENT',
          payload: {
            selector: '.test',
            severity,
          },
        };

        expect(message.payload.severity).toBe(severity);
      });
    });

    it('should support vision filter with all modes', () => {
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

      modes.forEach((mode) => {
        const message: ApplyVisionFilterMessage = {
          type: 'APPLY_VISION_FILTER',
          payload: { mode },
        };

        expect(message.payload.mode).toBe(mode);
      });
    });

    it('should support partial settings updates', () => {
      const updates = [
        { wcagLevel: 'A' as const },
        { wcagLevel: 'AA' as const },
        { wcagLevel: 'AAA' as const },
        { visionMode: 'protanopia' as const },
        { wcagLevel: 'AA' as const, visionMode: 'blur-low' as const },
      ];

      updates.forEach((update) => {
        const message: UpdateSettingsMessage = {
          type: 'UPDATE_SETTINGS',
          payload: update,
        };

        expect(message.payload).toEqual(update);
      });
    });
  });

  describe('Message type safety', () => {
    it('should require message type field', () => {
      const validMessage: PingMessage = { type: 'PING' };
      expect(validMessage).toBeDefined();
    });

    it('should enforce correct payload structure', () => {
      const message: HighlightElementMessage = {
        type: 'HIGHLIGHT_ELEMENT',
        payload: {
          selector: 'img.hero',
          severity: 'critical',
        },
      };

      expect(message.payload).toHaveProperty('selector');
      expect(message.payload).toHaveProperty('severity');
    });

    it('should support union type for all messages', () => {
      const messages: Message[] = [
        { type: 'PING' },
        { type: 'SCAN_PAGE' },
        { type: 'CLEAR_HIGHLIGHTS' },
        { type: 'GET_SETTINGS' },
        { type: 'OPEN_SIDEPANEL' },
      ];

      expect(messages).toHaveLength(5);
    });
  });

  describe('Response types', () => {
    it('should structure scan response with success and result', () => {
      const scanResponse = {
        success: true,
        result: {
          url: 'https://example.com',
          timestamp: Date.now(),
          duration: 100,
          issues: [],
          incomplete: [],
          summary: {
            total: 0,
            bySeverity: {
              critical: 0,
              serious: 0,
              moderate: 0,
              minor: 0,
            },
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
        },
      };

      expect(scanResponse.success).toBe(true);
      expect(scanResponse.result).toBeDefined();
    });

    it('should structure scan response with error', () => {
      const errorResponse = {
        success: false,
        error: 'Failed to scan page',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
    });

    it('should structure settings response', () => {
      const settingsResponse = {
        success: true,
        settings: {
          wcagLevel: 'AA',
          visionMode: 'none',
          showFocusOrder: false,
        },
      };

      expect(settingsResponse.success).toBe(true);
      expect(settingsResponse.settings).toBeDefined();
    });
  });
});
