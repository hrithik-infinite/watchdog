import { useCallback } from 'react';
import { useScanStore } from '../store';
import { getCurrentTab } from '@/shared/messaging';
import type { ScanResult } from '@/shared/types';

export function useScanner() {
  const { isScanning, scanResult, error, setScanning, setScanResult, setError } = useScanStore();

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);

    try {
      const tab = await getCurrentTab();
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Send scan message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });

      if (response?.success && response.result) {
        setScanResult(response.result as ScanResult);
      } else {
        throw new Error(response?.error || 'Scan failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      setScanResult(null);
    } finally {
      setScanning(false);
    }
  }, [setScanning, setScanResult, setError]);

  const clearResults = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, [setScanResult, setError]);

  return {
    isScanning,
    scanResult,
    error,
    scan,
    clearResults,
  };
}
