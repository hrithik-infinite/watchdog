import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHighlight } from '../useHighlight';

// Mock dependencies
vi.mock('@/shared/messaging', () => ({
  getCurrentTab: vi.fn(),
}));

vi.stubGlobal('chrome', {
  tabs: {
    sendMessage: vi.fn(),
  },
});

const { getCurrentTab } = await import('@/shared/messaging');

describe('useHighlight Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return highlightElement function', () => {
      const { result } = renderHook(() => useHighlight());

      expect(typeof result.current.highlightElement).toBe('function');
    });

    it('should return clearHighlights function', () => {
      const { result } = renderHook(() => useHighlight());

      expect(typeof result.current.clearHighlights).toBe('function');
    });
  });

  describe('highlightElement function', () => {
    it('should send highlight message to active tab', async () => {
      const mockTab = { id: 123, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector: '.test', severity: 'critical' },
      });
    });

    it('should send correct selector to content script', async () => {
      const mockTab = { id: 456, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('img.hero', 'serious');
      });

      const callArgs = (chrome.tabs.sendMessage as any).mock.calls[0];
      expect(callArgs[1].payload.selector).toBe('img.hero');
    });

    it('should send correct severity level', async () => {
      const mockTab = { id: 789, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'moderate');
      });

      const callArgs = (chrome.tabs.sendMessage as any).mock.calls[0];
      expect(callArgs[1].payload.severity).toBe('moderate');
    });

    it('should handle all severity levels', async () => {
      const mockTab = { id: 100, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const severities = ['critical', 'serious', 'moderate', 'minor'] as const;
      const { result } = renderHook(() => useHighlight());

      for (const severity of severities) {
        await act(async () => {
          await result.current.highlightElement('.test', severity);
        });
      }

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(4);

      severities.forEach((severity, index) => {
        const callArgs = (chrome.tabs.sendMessage as any).mock.calls[index];
        expect(callArgs[1].payload.severity).toBe(severity);
      });
    });

    it('should handle complex CSS selectors', async () => {
      const mockTab = { id: 111, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());
      const selector = 'main .section > .item:nth-child(2)';

      await act(async () => {
        await result.current.highlightElement(selector, 'critical');
      });

      const callArgs = (chrome.tabs.sendMessage as any).mock.calls[0];
      expect(callArgs[1].payload.selector).toBe(selector);
    });

    it('should handle ID selector', async () => {
      const mockTab = { id: 222, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('#hero-image', 'critical');
      });

      const callArgs = (chrome.tabs.sendMessage as any).mock.calls[0];
      expect(callArgs[1].payload.selector).toBe('#hero-image');
    });

    it('should handle attribute selector', async () => {
      const mockTab = { id: 333, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('button[type="submit"]', 'serious');
      });

      const callArgs = (chrome.tabs.sendMessage as any).mock.calls[0];
      expect(callArgs[1].payload.selector).toBe('button[type="submit"]');
    });

    it('should not call sendMessage if no tab found', async () => {
      (getCurrentTab as any).mockResolvedValue(null);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should not call sendMessage if tab has no ID', async () => {
      const mockTab = { url: 'https://example.com' }; // No id
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle sendMessage errors gracefully', async () => {
      const mockTab = { id: 444, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);
      (chrome.tabs.sendMessage as any).mockRejectedValue(new Error('Failed to send'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(errorSpy).toHaveBeenCalledWith('[WatchDog]', 'Failed to highlight element', expect.objectContaining({ selector: '.test' }));
      errorSpy.mockRestore();
    });

    it('should handle getCurrentTab errors gracefully', async () => {
      (getCurrentTab as any).mockRejectedValue(new Error('Tab query failed'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(errorSpy).toHaveBeenCalledWith('[WatchDog]', 'Failed to highlight element', expect.objectContaining({ selector: '.test' }));
      errorSpy.mockRestore();
    });
  });

  describe('clearHighlights function', () => {
    it('should send CLEAR_HIGHLIGHTS message to active tab', async () => {
      const mockTab = { id: 555, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(555, {
        type: 'CLEAR_HIGHLIGHTS',
      });
    });

    it('should use correct tab ID', async () => {
      const mockTab = { id: 666, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.clearHighlights();
      });

      const callArgs = (chrome.tabs.sendMessage as any).mock.calls[0];
      expect(callArgs[0]).toBe(666);
    });

    it('should not call sendMessage if no tab found', async () => {
      (getCurrentTab as any).mockResolvedValue(null);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should not call sendMessage if tab has no ID', async () => {
      const mockTab = { url: 'https://example.com' }; // No id
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle sendMessage errors gracefully', async () => {
      const mockTab = { id: 777, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);
      (chrome.tabs.sendMessage as any).mockRejectedValue(new Error('Failed to send'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(errorSpy).toHaveBeenCalledWith('[WatchDog]', 'Failed to clear highlights', expect.any(Object));
      errorSpy.mockRestore();
    });

    it('should handle getCurrentTab errors gracefully', async () => {
      (getCurrentTab as any).mockRejectedValue(new Error('Tab query failed'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(errorSpy).toHaveBeenCalledWith('[WatchDog]', 'Failed to clear highlights', expect.any(Object));
      errorSpy.mockRestore();
    });
  });

  describe('Multiple operations', () => {
    it('should handle highlight then clear sequence', async () => {
      const mockTab = { id: 888, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple consecutive highlights', async () => {
      const mockTab = { id: 999, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      const selectors = ['.element-1', '.element-2', '.element-3'];

      for (const selector of selectors) {
        await act(async () => {
          await result.current.highlightElement(selector, 'critical');
        });
      }

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid operations', async () => {
      const mockTab = { id: 1001, url: 'https://example.com' };
      (getCurrentTab as any).mockResolvedValue(mockTab);

      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await Promise.all([
          result.current.highlightElement('.test-1', 'critical'),
          result.current.highlightElement('.test-2', 'serious'),
          result.current.highlightElement('.test-3', 'moderate'),
        ]);
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Function stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useHighlight());

      const firstHighlight = result.current.highlightElement;
      const firstClear = result.current.clearHighlights;

      rerender();

      // Functions should maintain identity across re-renders
      expect(result.current.highlightElement).toBe(firstHighlight);
      expect(result.current.clearHighlights).toBe(firstClear);
    });
  });
});
