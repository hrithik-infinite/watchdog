import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '@/shared/logger';
import type { ScanProgressMessage, ScanResponse } from '@/shared/messaging';
import { type AuditType, useScanStore } from '../store';

/**
 * Drive scans from the side panel. The panel cannot touch the page itself (a side
 * panel never receives Chrome's activeTab grant), so this hook is a thin client:
 * it asks the background service worker — which holds the activeTab grant from the
 * toolbar-icon click — to run the audits against the armed tab, listens for the
 * progress it streams back, and reflects the final result into the store. All the
 * page work (guards, injection, the per-audit loop, timeout, badge) lives in
 * src/background/scan-orchestrator.ts.
 */
export function useScanner() {
  const isScanning = useScanStore((state) => state.isScanning);
  const scanResult = useScanStore((state) => state.scanResult);
  const error = useScanStore((state) => state.error);

  const setScanning = useScanStore((state) => state.setScanning);
  const setScanResult = useScanStore((state) => state.setScanResult);
  const setError = useScanStore((state) => state.setError);

  // Multi-scan progress, driven by SCAN_PROGRESS messages from the background.
  const [currentAuditIndex, setCurrentAuditIndex] = useState<number>(0);
  const [totalAudits, setTotalAudits] = useState<number>(0);
  const [currentAuditType, setCurrentAuditType] = useState<AuditType | null>(null);

  // Whether a scan is in flight, for cancelScan (no-op when idle).
  const scanningRef = useRef(false);

  // Subscribe to the per-audit progress the background streams during a scan.
  useEffect(() => {
    const listener = (message: unknown): void => {
      const msg = message as ScanProgressMessage;
      if (msg?.type === 'SCAN_PROGRESS') {
        setCurrentAuditIndex(msg.payload.index);
        setTotalAudits(msg.payload.total);
        setCurrentAuditType(msg.payload.auditType as AuditType);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const runScan = useCallback(
    async (auditTypes: AuditType[]) => {
      if (auditTypes.length === 0) return;

      setScanning(true);
      scanningRef.current = true;
      setError(null);
      setCurrentAuditIndex(0);
      setTotalAudits(auditTypes.length);
      setCurrentAuditType(auditTypes[0]);

      // Let React paint the loading state before the (awaited) request.
      await new Promise((resolve) => setTimeout(resolve, 0));

      logger.group(`Scan: ${auditTypes.join(', ')}`);

      try {
        const response = (await chrome.runtime.sendMessage({
          type: 'SCAN_REQUEST',
          payload: { auditTypes },
        })) as ScanResponse | undefined;

        if (response?.cancelled) {
          // User cancelled: keep any prior results, surface no error.
          logger.info('Scan cancelled by user');
          return;
        }

        if (response?.success && response.result) {
          setScanResult(response.result);
          // A partial multi-scan failure returns results plus a banner message in
          // `error`; a clean run leaves it undefined (→ null clears any old banner).
          setError(response.error ?? null);
        } else {
          setError(response?.error || 'Scan failed');
          setScanResult(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        logger.error('Scan failed', { error: message });
        setError(message);
        setScanResult(null);
      } finally {
        setScanning(false);
        scanningRef.current = false;
        setCurrentAuditType(null);
        logger.groupEnd();
      }
    },
    [setScanning, setScanResult, setError]
  );

  const scan = useCallback((auditType: string) => runScan([auditType as AuditType]), [runScan]);

  const scanMultiple = useCallback((auditTypes: AuditType[]) => runScan(auditTypes), [runScan]);

  const clearResults = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, [setScanResult, setError]);

  // Ask the background to abort the in-flight scan. The SCAN_REQUEST response then
  // resolves with { cancelled: true } and the handler above leaves state intact.
  const cancelScan = useCallback(() => {
    if (!scanningRef.current) return;
    chrome.runtime
      .sendMessage({ type: 'CANCEL_SCAN' })
      .catch((err) => logger.error('Failed to cancel scan', { error: err }));
  }, []);

  return {
    isScanning,
    scanResult,
    error,
    scan,
    scanMultiple,
    cancelScan,
    clearResults,
    currentAuditIndex,
    totalAudits,
    currentAuditType,
  };
}
