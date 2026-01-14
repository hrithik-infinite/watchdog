import { useCallback } from 'react';
import { useScanStore } from '../store';
import { getCurrentTab } from '@/shared/messaging';
import type { ScanResult } from '@/shared/types';

async function checkContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return true;
  } catch {
    return false;
  }
}

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

      // Check if this is a restricted page
      if (
        tab.url?.startsWith('chrome://') ||
        tab.url?.startsWith('chrome-extension://') ||
        tab.url?.startsWith('about:')
      ) {
        throw new Error('Cannot scan browser internal pages');
      }

      // Check if content script is loaded
      const isLoaded = await checkContentScriptLoaded(tab.id);
      if (!isLoaded) {
        throw new Error('Please refresh the page and try again');
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
