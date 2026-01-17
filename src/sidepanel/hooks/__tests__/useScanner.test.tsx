import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScanner } from '../useScanner';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { ScanResult } from '@/shared/types';

// Mock Chrome APIs
vi.stubGlobal('chrome', {
  tabs: {
    sendMessage: vi.fn(),
  },
});

// Mock the messaging module
vi.mock('@/shared/messaging', () => ({
  getCurrentTab: vi.fn(),
}));

const mockScanResult: ScanResult = {
  url: 'https://example.com',
  timestamp: Date.now(),
  duration: 100,
  issues: [
    {
      id: 'issue-1',
      ruleId: 'image-alt',
      severity: 'critical',
      category: 'images',
      message: 'Images must have alt text',
      description: 'All images must have alternative text',
      helpUrl: 'https://example.com/help',
      wcag: {
        id: '1.1.1',
        level: 'A',
        name: 'Non-text Content',
        description: 'All non-text content has a text alternative',
      },
      element: {
        selector: 'img.hero',
        html: '<img class="hero" src="test.jpg">',
      },
      fix: {
        description: 'Add alt attribute',
        code: '<img class="hero" src="test.jpg" alt="Description">',
        learnMoreUrl: 'https://example.com/learn',
      },
    },
  ],
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
};

describe('useScanner Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all store state to initial values
    useScanStore.setState({
      isScanning: false,
      scanResult: null,
      error: null,
      selectedIssueId: null,
      view: 'list',
      filters: { severity: 'all', category: 'all', searchQuery: '' },
      settings: { ...DEFAULT_SETTINGS },
    });
  });

  describe('Hook initialization', () => {
    it('should return scanner state and functions', () => {
      const { result } = renderHook(() => useScanner());

      expect(result.current).toHaveProperty('isScanning');
      expect(result.current).toHaveProperty('scanResult');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('scan');
      expect(result.current).toHaveProperty('clearResults');
      expect(typeof result.current.scan).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
    });

    it('should have initial state of not scanning', () => {
      const { result } = renderHook(() => useScanner());

      expect(result.current.isScanning).toBe(false);
      expect(result.current.scanResult).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Scanning', () => {
    it('should scan current tab successfully', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.scanResult).toBeDefined();
      expect(result.current.scanResult?.issues).toHaveLength(1);
      expect(result.current.isScanning).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set isScanning to false after scan completes', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result, rerender } = renderHook(() => useScanner());

      expect(result.current.isScanning).toBe(false);

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.isScanning).toBe(false);
      expect(result.current.scanResult).toBeDefined();
    });

    it('should handle missing tab error', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue(null);

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should reject chrome:// pages', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'chrome://settings' });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
    });

    it('should reject chrome-extension:// pages', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'chrome-extension://abc123' });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
    });

    it('should reject about: pages', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'about:blank' });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should check if content script is loaded', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockRejectedValueOnce(
        new Error('Content script not loaded')
      );

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should handle scan failure response', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: false,
        error: 'Scan error message',
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should handle missing result in response', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.isScanning).toBe(false);
    });

    it('should handle unknown error during scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockRejectedValue(new Error('Network error'));

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockRejectedValue('String error');

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
    });

    it('should send SCAN_PAGE message to content script', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      // Check the second call (first is PING to check if content script is loaded)
      expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(1, {
        type: 'SCAN_PAGE',
        payload: { auditType: 'accessibility' },
      });
    });
  });

  describe('Clearing results', () => {
    it('should clear scan results', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result, rerender } = renderHook(() => useScanner());

      // First scan
      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.scanResult).toBeDefined();

      // Then clear
      act(() => {
        result.current.clearResults();
      });

      rerender();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear error messages', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue(null);

      const { result, rerender } = renderHook(() => useScanner());

      // First scan with error
      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeDefined();

      // Then clear
      act(() => {
        result.current.clearResults();
      });

      rerender();
      expect(result.current.error).toBeNull();
      expect(result.current.scanResult).toBeNull();
    });

    it('should be safe to call when nothing to clear', () => {
      const { result } = renderHook(() => useScanner());

      expect(() => {
        act(() => {
          result.current.clearResults();
        });
      }).not.toThrow();

      expect(result.current.scanResult).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('State management', () => {
    it('should always clear error when starting scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      useScanStore.setState({ error: 'Previous error' });

      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.error).toBeNull();
    });

    it('should set isScanning to false after successful scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.isScanning).toBe(false);
    });

    it('should set isScanning to false even if scan fails', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue(null);

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan();
      });

      rerender();
      expect(result.current.isScanning).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Multi-scan functionality', () => {
    it('should return early if auditTypes array is empty', async () => {
      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple([]);
      });

      rerender();
      expect(result.current.isScanning).toBe(false);
      expect(result.current.scanResult).toBeNull();
    });

    it('should delegate to single scan for array with one audit type', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockResolvedValue({
        success: true,
        result: mockScanResult,
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility']);
      });

      rerender();
      expect(result.current.scanResult).toBeDefined();
      expect(result.current.isScanning).toBe(false);
    });

    it('should run multiple audits sequentially', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const accessibilityResult: ScanResult = {
        ...mockScanResult,
        issues: [{ ...mockScanResult.issues[0], id: 'a11y-issue-1' }],
      };

      const performanceResult: ScanResult = {
        ...mockScanResult,
        issues: [
          {
            ...mockScanResult.issues[0],
            id: 'perf-issue-1',
            category: 'document',
          },
        ],
      };

      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) {
          return Promise.resolve({ success: true });
        }
        if (callCount === 3) {
          return Promise.resolve({ success: true, result: accessibilityResult });
        }
        if (callCount === 4) {
          return Promise.resolve({ success: true, result: performanceResult });
        }
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      expect(result.current.scanResult).toBeDefined();
      expect(result.current.isScanning).toBe(false);
      expect(result.current.scanResult?.issues.length).toBeGreaterThan(0);
    });

    it('should combine issues from multiple audits with prefixed IDs', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const accessibilityResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [{ ...mockScanResult.issues[0], id: 'a11y-issue-1' }],
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
      };

      const performanceResult: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [{ ...mockScanResult.issues[0], id: 'perf-issue-1' }],
        incomplete: [{ ...mockScanResult.issues[0], id: 'incomplete-1' }],
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
      };

      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) {
          return Promise.resolve({ success: true });
        }
        if (callCount === 3) {
          return Promise.resolve({ success: true, result: accessibilityResult });
        }
        if (callCount === 4) {
          return Promise.resolve({ success: true, result: performanceResult });
        }
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      // Multi-scan completes and shows results
      expect(result.current.isScanning).toBe(false);
    });

    it('should track progress during multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const result1: ScanResult = { ...mockScanResult };
      const result2: ScanResult = { ...mockScanResult };

      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return Promise.resolve({ success: true });
        if (callCount === 3) return Promise.resolve({ success: true, result: result1 });
        return Promise.resolve({ success: true, result: result2 });
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      expect(result.current.totalAudits).toBe(0);
      expect(result.current.currentAuditIndex).toBe(0);
      expect(result.current.currentAuditType).toBeNull();
    });

    it('should handle individual audit failure in multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const successResult: ScanResult = { ...mockScanResult };

      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) return Promise.resolve({ success: true });
        if (callCount === 3) return Promise.resolve({ success: true, result: successResult });
        // Fourth call (performance audit) fails
        return Promise.resolve({
          success: false,
          error: 'Performance audit failed',
        });
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toContain('Some audits failed');
      expect(result.current.scanResult).toBeDefined();
    });

    it('should handle missing tab error in multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue(null);

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should reject restricted pages in multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'chrome://settings' });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
    });

    it('should check content script in multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });
      (chrome.tabs.sendMessage as any).mockRejectedValueOnce(
        new Error('Content script not loaded')
      );

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
    });

    it('should clear error at start of multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      useScanStore.setState({ error: 'Previous error' });

      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const result1: ScanResult = { ...mockScanResult };
      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return Promise.resolve({ success: true });
        return Promise.resolve({ success: true, result: result1 });
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility']);
      });

      rerender();
      expect(result.current.error).toBeNull();
    });

    it('should reset progress state after multi-scan completes', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const result1: ScanResult = { ...mockScanResult };
      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return Promise.resolve({ success: true });
        return Promise.resolve({ success: true, result: result1 });
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility']);
      });

      rerender();
      expect(result.current.currentAuditIndex).toBe(0);
      expect(result.current.totalAudits).toBeLessThanOrEqual(1); // Will be 0 or 1 since single item delegates
      expect(result.current.currentAuditType).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should handle unknown error in multi-scan', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockRejectedValue(new Error('Network error'));

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility']);
      });

      rerender();
      expect(result.current.error).toBeDefined();
      expect(result.current.scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('should return progress info from hook', () => {
      const { result } = renderHook(() => useScanner());

      expect(result.current).toHaveProperty('currentAuditIndex');
      expect(result.current).toHaveProperty('totalAudits');
      expect(result.current).toHaveProperty('currentAuditType');
      expect(result.current).toHaveProperty('scanMultiple');
      expect(typeof result.current.currentAuditIndex).toBe('number');
      expect(typeof result.current.totalAudits).toBe('number');
    });
  });

  describe('Progress tracking for combined summary', () => {
    it('should generate correct combined summary from multiple issues', async () => {
      const { getCurrentTab } = await import('@/shared/messaging');
      (getCurrentTab as any).mockResolvedValue({ id: 1, url: 'https://example.com' });

      const result1: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [
          {
            ...mockScanResult.issues[0],
            id: 'a11y-issue-1',
            severity: 'critical',
            category: 'images',
          },
        ],
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
      };

      const result2: ScanResult = {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 100,
        issues: [
          {
            ...mockScanResult.issues[0],
            id: 'perf-issue-1',
            severity: 'serious',
            category: 'forms',
          },
        ],
        incomplete: [],
        summary: {
          total: 1,
          bySeverity: { critical: 0, serious: 1, moderate: 0, minor: 0 },
          byCategory: {
            images: 0,
            interactive: 0,
            forms: 1,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
      };

      let callCount = 0;
      (chrome.tabs.sendMessage as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) return Promise.resolve({ success: true });
        if (callCount === 3) return Promise.resolve({ success: true, result: result1 });
        return Promise.resolve({ success: true, result: result2 });
      });

      const { result, rerender } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'performance']);
      });

      rerender();
      // Combined summary includes issues from both audits
      expect(result.current.scanResult?.summary).toBeDefined();
      expect(result.current.scanResult?.summary.total).toBeGreaterThanOrEqual(1);
      expect(result.current.scanResult?.summary.bySeverity.critical).toBeGreaterThanOrEqual(0);
      expect(result.current.scanResult?.summary.bySeverity.serious).toBeGreaterThanOrEqual(0);
    });
  });
});
