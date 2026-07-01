import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { ScanResult } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { useScanner } from '../useScanner';

// The panel is now a thin client: it asks the background to run the scan and
// reflects the response. No tab resolution, host-permission, or injection happens
// here — those moved to src/background/scan-orchestrator.ts (see its test). So the
// only page-facing surface to mock is chrome.runtime (sendMessage + the
// SCAN_PROGRESS onMessage listener).
let progressListener: ((msg: unknown) => void) | undefined;
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve({ success: true })),
    onMessage: {
      addListener: (cb: (msg: unknown) => void) => {
        progressListener = cb;
      },
      removeListener: vi.fn(),
    },
  },
});

const mockScanResult: ScanResult = {
  url: 'https://example.com',
  timestamp: 1_700_000_000,
  duration: 100,
  issues: [],
  incomplete: [],
  summary: {
    total: 3,
    bySeverity: { critical: 1, serious: 1, moderate: 1, minor: 0 },
    byCategory: {
      images: 1,
      interactive: 0,
      forms: 0,
      color: 0,
      document: 0,
      structure: 2,
      aria: 0,
      technical: 0,
    },
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const sendMessage = () => chrome.runtime.sendMessage as unknown as ReturnType<typeof vi.fn>;

describe('useScanner Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    progressListener = undefined;
    (chrome.runtime.sendMessage as any).mockResolvedValue({ success: true });
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
    it('exposes scanner state and functions', () => {
      const { result } = renderHook(() => useScanner());
      expect(result.current.isScanning).toBe(false);
      expect(result.current.scanResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.scan).toBe('function');
      expect(typeof result.current.scanMultiple).toBe('function');
      expect(typeof result.current.cancelScan).toBe('function');
      expect(typeof result.current.clearResults).toBe('function');
    });
  });

  describe('scan', () => {
    it('sends a SCAN_REQUEST for the audit and stores the returned result', async () => {
      sendMessage().mockResolvedValue({ success: true, result: mockScanResult });
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan('accessibility');
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SCAN_REQUEST',
        payload: { auditTypes: ['accessibility'] },
      });
      expect(useScanStore.getState().scanResult).toEqual(mockScanResult);
      expect(useScanStore.getState().error).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('surfaces a failure response as an error and clears results', async () => {
      sendMessage().mockResolvedValue({
        success: false,
        error: 'Cannot scan browser internal pages',
      });
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan('accessibility');
      });

      expect(useScanStore.getState().error).toBe('Cannot scan browser internal pages');
      expect(useScanStore.getState().scanResult).toBeNull();
    });

    it('keeps a partial multi-scan result and shows the banner error', async () => {
      sendMessage().mockResolvedValue({
        success: true,
        result: mockScanResult,
        error: 'Some audits failed: pwa: boom',
      });
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'pwa']);
      });

      expect(useScanStore.getState().scanResult).toEqual(mockScanResult);
      expect(useScanStore.getState().error).toBe('Some audits failed: pwa: boom');
    });

    it('leaves prior results untouched when the scan was cancelled', async () => {
      useScanStore.setState({ scanResult: mockScanResult });
      sendMessage().mockResolvedValue({ success: false, cancelled: true });
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan('accessibility');
      });

      expect(useScanStore.getState().scanResult).toEqual(mockScanResult);
      expect(useScanStore.getState().error).toBeNull();
    });

    it('handles a rejected message channel as an error', async () => {
      sendMessage().mockRejectedValue(new Error('disconnected'));
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan('accessibility');
      });

      expect(useScanStore.getState().error).toBe('disconnected');
      expect(useScanStore.getState().scanResult).toBeNull();
      expect(result.current.isScanning).toBe(false);
    });

    it('clears any prior error at the start of a scan', async () => {
      useScanStore.setState({ error: 'old error' });
      sendMessage().mockResolvedValue({ success: true, result: mockScanResult });
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scan('accessibility');
      });

      expect(useScanStore.getState().error).toBeNull();
    });
  });

  describe('scanMultiple', () => {
    it('sends every requested audit type in one SCAN_REQUEST', async () => {
      sendMessage().mockResolvedValue({ success: true, result: mockScanResult });
      const { result } = renderHook(() => useScanner());

      await act(async () => {
        await result.current.scanMultiple(['accessibility', 'seo', 'pwa']);
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'SCAN_REQUEST',
        payload: { auditTypes: ['accessibility', 'seo', 'pwa'] },
      });
    });

    it('returns early for an empty audit list without messaging the background', async () => {
      const { result } = renderHook(() => useScanner());
      await act(async () => {
        await result.current.scanMultiple([]);
      });
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('progress', () => {
    it('advances progress state from SCAN_PROGRESS messages', () => {
      const { result } = renderHook(() => useScanner());
      expect(progressListener).toBeTypeOf('function');

      act(() => {
        progressListener?.({
          type: 'SCAN_PROGRESS',
          payload: { index: 2, total: 6, auditType: 'seo' },
        });
      });

      expect(result.current.currentAuditIndex).toBe(2);
      expect(result.current.totalAudits).toBe(6);
      expect(result.current.currentAuditType).toBe('seo');
    });

    it('ignores unrelated broadcast messages', () => {
      const { result } = renderHook(() => useScanner());
      act(() => {
        progressListener?.({ type: 'SOMETHING_ELSE' });
      });
      expect(result.current.currentAuditType).toBeNull();
    });
  });

  describe('cancelScan', () => {
    it('is a no-op when no scan is in flight', () => {
      const { result } = renderHook(() => useScanner());
      act(() => {
        result.current.cancelScan();
      });
      expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith({ type: 'CANCEL_SCAN' });
    });

    it('sends CANCEL_SCAN while a scan is in flight', async () => {
      const d = deferred<{ success: boolean; cancelled?: boolean }>();
      sendMessage().mockImplementation((msg: { type: string }) =>
        msg.type === 'SCAN_REQUEST' ? d.promise : Promise.resolve({ success: true })
      );
      const { result } = renderHook(() => useScanner());

      let scanPromise: Promise<void> | undefined;
      await act(async () => {
        scanPromise = result.current.scan('accessibility');
        // Flush the internal setTimeout(0) so the request dispatches; the response
        // stays pending on the deferred, leaving the scan in flight.
        await new Promise((r) => setTimeout(r, 0));
      });

      await act(async () => {
        result.current.cancelScan();
      });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'CANCEL_SCAN' });

      await act(async () => {
        d.resolve({ success: false, cancelled: true });
        await scanPromise;
      });
    });
  });

  describe('clearResults', () => {
    it('clears the result and error', () => {
      useScanStore.setState({ scanResult: mockScanResult, error: 'boom' });
      const { result } = renderHook(() => useScanner());
      act(() => {
        result.current.clearResults();
      });
      expect(useScanStore.getState().scanResult).toBeNull();
      expect(useScanStore.getState().error).toBeNull();
    });
  });
});
