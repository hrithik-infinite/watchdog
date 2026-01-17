import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useIgnoredIssues } from '../useIgnoredIssues';
import * as storage from '@/shared/storage';
import logger from '@/shared/logger';

// Mock the storage module
vi.mock('@/shared/storage', () => ({
  getIgnoredIssuesForDomain: vi.fn(),
  unignoreIssue: vi.fn(),
  clearIgnoredIssuesForDomain: vi.fn(),
  generateIssueHash: vi.fn(),
}));

// Mock logger
vi.mock('@/shared/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockIgnoredIssues: storage.IgnoredIssue[] = [
  {
    hash: 'button::button-name',
    selector: 'button',
    ruleId: 'button-name',
    message: 'Button has no accessible name',
    reason: 'fixed',
    ignoredAt: Date.now(),
    domain: 'example.com',
  },
  {
    hash: 'input[id="name"]::label',
    selector: 'input[id="name"]',
    ruleId: 'label',
    message: 'Input has no associated label',
    reason: 'not-applicable',
    customNote: 'Label is handled dynamically',
    ignoredAt: Date.now() - 1000,
    domain: 'example.com',
  },
];

describe('useIgnoredIssues Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.getIgnoredIssuesForDomain as any).mockResolvedValue([]);
    (storage.generateIssueHash as any).mockImplementation(
      (selector: string, ruleId: string) => `${selector}::${ruleId}`
    );
  });

  describe('Hook initialization', () => {
    it('should return all required properties', async () => {
      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current).toHaveProperty('ignoredIssues');
        expect(result.current).toHaveProperty('ignoredHashes');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('ignoredCount');
        expect(result.current).toHaveProperty('unignore');
        expect(result.current).toHaveProperty('clearAll');
        expect(result.current).toHaveProperty('refresh');
        expect(result.current).toHaveProperty('isIgnored');
      });
    });

    it('should initialize with empty arrays when no URL provided', async () => {
      const { result } = renderHook(() => useIgnoredIssues(undefined));

      await waitFor(() => {
        expect(result.current.ignoredIssues).toEqual([]);
        expect(result.current.ignoredHashes).toEqual(new Set());
        expect(result.current.ignoredCount).toBe(0);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should initialize with empty data', async () => {
      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredIssues).toEqual([]);
        expect(result.current.ignoredHashes instanceof Set).toBe(true);
        expect(result.current.ignoredCount).toBe(0);
      });
    });

    it('should have all callback functions be callable', async () => {
      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(typeof result.current.unignore).toBe('function');
        expect(typeof result.current.clearAll).toBe('function');
        expect(typeof result.current.refresh).toBe('function');
        expect(typeof result.current.isIgnored).toBe('function');
      });
    });
  });

  describe('Loading ignored issues', () => {
    it('should load ignored issues when URL is provided', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(storage.getIgnoredIssuesForDomain).toHaveBeenCalledWith('https://example.com');
        expect(result.current.ignoredIssues).toEqual(mockIgnoredIssues);
        expect(result.current.ignoredCount).toBe(2);
      });
    });

    it('should populate ignoredHashes with issue hashes', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredHashes.has('button::button-name')).toBe(true);
        expect(result.current.ignoredHashes.has('input[id="name"]::label')).toBe(true);
      });
    });

    it('should log loading operation', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalledWith('Loading ignored issues', {
          url: 'https://example.com',
        });
        expect(logger.info).toHaveBeenCalledWith('Ignored issues loaded', {
          count: 2,
        });
      });
    });

    it('should handle empty ignored issues list', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue([]);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredIssues).toEqual([]);
        expect(result.current.ignoredCount).toBe(0);
        expect(result.current.ignoredHashes.size).toBe(0);
      });
    });

    it('should handle load errors gracefully', async () => {
      const error = new Error('Storage error');
      (storage.getIgnoredIssuesForDomain as any).mockRejectedValue(error);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith('Failed to load ignored issues', { error });
        expect(result.current.ignoredIssues).toEqual([]);
      });
    });

    it('should set loading state correctly', async () => {
      let resolveLoad: (() => void) | null = null;
      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve;
      });

      (storage.getIgnoredIssuesForDomain as any).mockReturnValue(loadPromise);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      expect(result.current.isLoading).toBe(true);

      resolveLoad?.();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Unignore functionality', () => {
    it('should unignore a specific issue', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.unignore('button', 'button-name');
      });

      expect(storage.unignoreIssue).toHaveBeenCalledWith(
        'https://example.com',
        'button',
        'button-name'
      );
    });

    it('should refresh ignored issues after unignoring', async () => {
      (storage.getIgnoredIssuesForDomain as any)
        .mockResolvedValueOnce(mockIgnoredIssues)
        .mockResolvedValueOnce([mockIgnoredIssues[1]]); // After unignore

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.unignore('button', 'button-name');
      });

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(1);
        expect(storage.getIgnoredIssuesForDomain).toHaveBeenCalledTimes(2);
      });
    });

    it('should log unignore operation', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.unignore('button', 'button-name');
      });

      expect(logger.info).toHaveBeenCalledWith('Unignoring issue', {
        selector: 'button',
        ruleId: 'button-name',
      });
    });

    it('should handle unignore errors', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);
      (storage.unignoreIssue as any).mockRejectedValue(new Error('Unignore failed'));

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.unignore('button', 'button-name');
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to unignore issue', {
        error: expect.any(Error),
      });
    });

    it('should not unignore when URL is undefined', async () => {
      const { result } = renderHook(() => useIgnoredIssues(undefined));

      await act(async () => {
        await result.current.unignore('button', 'button-name');
      });

      expect(storage.unignoreIssue).not.toHaveBeenCalled();
    });
  });

  describe('Clear all functionality', () => {
    it('should clear all ignored issues for domain', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.clearAll();
      });

      expect(storage.clearIgnoredIssuesForDomain).toHaveBeenCalledWith('https://example.com');
    });

    it('should refresh ignored issues after clearing', async () => {
      (storage.getIgnoredIssuesForDomain as any)
        .mockResolvedValueOnce(mockIgnoredIssues)
        .mockResolvedValueOnce([]); // After clear

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.clearAll();
      });

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(0);
        expect(result.current.ignoredHashes.size).toBe(0);
      });
    });

    it('should log clear operation', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.clearAll();
      });

      expect(logger.info).toHaveBeenCalledWith('Clearing all ignored issues', {
        url: 'https://example.com',
      });
    });

    it('should handle clear errors', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);
      (storage.clearIgnoredIssuesForDomain as any).mockRejectedValue(new Error('Clear failed'));

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      await act(async () => {
        await result.current.clearAll();
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to clear ignored issues', {
        error: expect.any(Error),
      });
    });

    it('should not clear when URL is undefined', async () => {
      const { result } = renderHook(() => useIgnoredIssues(undefined));

      await act(async () => {
        await result.current.clearAll();
      });

      expect(storage.clearIgnoredIssuesForDomain).not.toHaveBeenCalled();
    });
  });

  describe('isIgnored check', () => {
    it('should return true for ignored issue', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.isIgnored('button', 'button-name')).toBe(true);
      });

      // After data is loaded, check another ignored issue
      expect(result.current.isIgnored('input[id="name"]', 'label')).toBe(true);
    });

    it('should return false for non-ignored issue', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.isIgnored('div', 'color-contrast')).toBe(false);
        expect(result.current.isIgnored('img', 'image-alt')).toBe(false);
      });
    });

    it('should generate correct hash for comparison', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        result.current.isIgnored('button', 'button-name');

        expect(storage.generateIssueHash).toHaveBeenCalledWith('button', 'button-name');
      });
    });
  });

  describe('Refresh functionality', () => {
    it('should refresh ignored issues', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      vi.clearAllMocks();
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue([]);

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(0);
      });
    });

    it('should call storage function when refreshing', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(storage.getIgnoredIssuesForDomain).toHaveBeenCalledWith('https://example.com');
      });
    });
  });

  describe('URL changes', () => {
    it('should reload issues when URL changes', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { rerender } = renderHook(
        ({ url }: { url: string | undefined }) => useIgnoredIssues(url),
        { initialProps: { url: 'https://example.com' } }
      );

      await waitFor(() => {
        expect(storage.getIgnoredIssuesForDomain).toHaveBeenCalledWith('https://example.com');
      });

      vi.clearAllMocks();
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue([]);

      rerender({ url: 'https://different.com' });

      await waitFor(() => {
        expect(storage.getIgnoredIssuesForDomain).toHaveBeenCalledWith('https://different.com');
      });
    });

    it('should clear data when URL becomes undefined', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result, rerender } = renderHook(
        ({ url }: { url: string | undefined }) => useIgnoredIssues(url),
        { initialProps: { url: 'https://example.com' } }
      );

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      rerender({ url: undefined });

      await waitFor(() => {
        expect(result.current.ignoredIssues).toEqual([]);
        expect(result.current.ignoredCount).toBe(0);
      });
    });
  });

  describe('Return value stability', () => {
    it('should have stable ignoredHashes Set', async () => {
      (storage.getIgnoredIssuesForDomain as any).mockResolvedValue(mockIgnoredIssues);

      const { result, rerender } = renderHook(() => useIgnoredIssues('https://example.com'));

      await waitFor(() => {
        expect(result.current.ignoredCount).toBe(2);
      });

      const initialHashes = result.current.ignoredHashes;

      rerender();

      // Hashes should be updated with new Set, but values should be same
      expect(result.current.ignoredHashes.size).toBe(initialHashes.size);
    });
  });
});
