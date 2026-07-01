import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHighlight } from '../useHighlight';

// The panel no longer resolves a target tab or messages the page directly — it
// asks the background (which holds activeTab) to forward the highlight to the
// armed tab's content script. So every op is a single chrome.runtime.sendMessage.
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
  },
});

describe('useHighlight Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.runtime.sendMessage as any).mockResolvedValue({ success: true });
  });

  describe('Hook initialization', () => {
    it('returns highlightElement, highlightAll, and clearHighlights functions', () => {
      const { result } = renderHook(() => useHighlight());
      expect(typeof result.current.highlightElement).toBe('function');
      expect(typeof result.current.highlightAll).toBe('function');
      expect(typeof result.current.clearHighlights).toBe('function');
    });

    it('returns stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useHighlight());
      const firstHighlight = result.current.highlightElement;
      const firstClear = result.current.clearHighlights;
      rerender();
      expect(result.current.highlightElement).toBe(firstHighlight);
      expect(result.current.clearHighlights).toBe(firstClear);
    });
  });

  describe('highlightElement', () => {
    it('sends a HIGHLIGHT_ELEMENT message to the background (no tabId — the SW targets the armed tab)', async () => {
      const { result } = renderHook(() => useHighlight());
      await act(async () => {
        await result.current.highlightElement('img.hero', 'critical');
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector: 'img.hero', severity: 'critical' },
      });
    });

    it('forwards each severity level verbatim', async () => {
      const severities = ['critical', 'serious', 'moderate', 'minor'] as const;
      const { result } = renderHook(() => useHighlight());

      for (const severity of severities) {
        await act(async () => {
          await result.current.highlightElement('.test', severity);
        });
      }

      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(4);
      severities.forEach((severity, index) => {
        expect((chrome.runtime.sendMessage as any).mock.calls[index][0].payload.severity).toBe(
          severity
        );
      });
    });

    it('swallows and logs sendMessage errors', async () => {
      (chrome.runtime.sendMessage as any).mockRejectedValue(new Error('Failed to send'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());
      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[WatchDog]',
        'Failed to highlight element',
        expect.objectContaining({ selector: '.test' })
      );
      errorSpy.mockRestore();
    });
  });

  describe('highlightAll (WAVE-style overlay)', () => {
    it('sends one HIGHLIGHT_ALL message carrying every item', async () => {
      const items = [
        { selector: '.a', severity: 'critical' as const },
        { selector: '.b', severity: 'minor' as const },
      ];

      const { result } = renderHook(() => useHighlight());
      await act(async () => {
        await result.current.highlightAll(items);
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'HIGHLIGHT_ALL',
        payload: { items },
      });
    });

    it('swallows and logs sendMessage errors', async () => {
      (chrome.runtime.sendMessage as any).mockRejectedValue(new Error('boom'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());
      await act(async () => {
        await result.current.highlightAll([{ selector: '.a', severity: 'critical' }]);
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[WatchDog]',
        'Failed to highlight all elements',
        expect.any(Object)
      );
      errorSpy.mockRestore();
    });
  });

  describe('clearHighlights', () => {
    it('sends a CLEAR_HIGHLIGHTS message to the background', async () => {
      const { result } = renderHook(() => useHighlight());
      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'CLEAR_HIGHLIGHTS' });
    });

    it('swallows and logs sendMessage errors', async () => {
      (chrome.runtime.sendMessage as any).mockRejectedValue(new Error('Failed to send'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useHighlight());
      await act(async () => {
        await result.current.clearHighlights();
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[WatchDog]',
        'Failed to clear highlights',
        expect.any(Object)
      );
      errorSpy.mockRestore();
    });
  });

  describe('Multiple operations', () => {
    it('handles a highlight then clear sequence', async () => {
      const { result } = renderHook(() => useHighlight());

      await act(async () => {
        await result.current.highlightElement('.test', 'critical');
      });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.clearHighlights();
      });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });
  });
});
