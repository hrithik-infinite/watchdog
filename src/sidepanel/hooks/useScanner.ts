import { useCallback, useRef, useState } from 'react';
import { ensureContentScript } from '@/shared/inject';
import logger from '@/shared/logger';
import { getCurrentTab } from '@/shared/messaging';
import type { Category, Issue, ScanResult, ScanSummary, Severity } from '@/shared/types';
import { type AuditType, useScanStore } from '../store';

// A single audit must not hang the panel forever (e.g. axe.run on a huge DOM).
// After this budget the scan is failed with a timeout (E004) so the UI recovers.
const SCAN_TIMEOUT_MS = 30000;

// Rejects after `ms`; returns a clear() so the timer never outlives the scan.
function rejectAfter(ms: number, message: string): { promise: Promise<never>; clear: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return { promise, clear: () => clearTimeout(timer) };
}

// Rejects as soon as the signal aborts, so a user Cancel interrupts an in-flight
// (possibly hung) scan instead of waiting for it to resolve.
function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise<never>((_, reject) => {
    if (signal.aborted) {
      reject(new Error('Scan cancelled'));
      return;
    }
    signal.addEventListener('abort', () => reject(new Error('Scan cancelled')), { once: true });
  });
}

// Some tabs are valid http(s)/file/view-source URLs (so they pass the chrome://
// /about:/extension internal-page check) yet still cannot be scanned: the Chrome
// Web Store blocks content scripts, and view-source:/file:/PDF tabs have no
// scannable HTML DOM. Return a DISTINCT, actionable message for each so the user
// learns *why* instead of seeing the generic "internal pages" error or a confusing
// 30s timeout. The returned text flows through getErrorDetails() (falls through to
// E005, which preserves the message verbatim). Returns null when the URL is scannable.
function getUnscannableReason(url: string | undefined): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();

  if (lower.startsWith('view-source:')) {
    return 'WatchDog cannot scan view-source pages. Open the page normally to scan it.';
  }
  // The extension gallery disallows content scripts, so a scan there never responds.
  if (
    lower.startsWith('https://chrome.google.com/webstore') ||
    lower.startsWith('https://chromewebstore.google.com')
  ) {
    return 'WatchDog cannot scan the Chrome Web Store. Open a regular website to scan it.';
  }
  // PDFs (served or local) render in the built-in viewer, which exposes no HTML DOM.
  // Strip any query/hash before matching the extension.
  const pathname = lower.split(/[?#]/)[0];
  if (pathname.endsWith('.pdf')) {
    return 'WatchDog cannot scan PDF documents. Open an HTML web page to scan it.';
  }
  if (lower.startsWith('file://')) {
    return 'WatchDog cannot scan local files. Open an http:// or https:// page to scan it.';
  }
  return null;
}

// Generate combined summary from issues
function generateCombinedSummary(issues: Issue[]): ScanSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  const byCategory: Record<Category, number> = {
    images: 0,
    interactive: 0,
    forms: 0,
    color: 0,
    document: 0,
    structure: 0,
    aria: 0,
    technical: 0,
  };

  issues.forEach((issue) => {
    bySeverity[issue.severity]++;
    byCategory[issue.category]++;
  });

  return {
    total: issues.length,
    bySeverity,
    byCategory,
  };
}

// Set the toolbar badge on the scanned tab to a total. Fire-and-forget so a
// badge failure never affects the scan result. Used so a multi-scan badge shows
// the combined total, not the last audit's count (correctness-5), on the tab that
// was actually scanned (correctness-4).
function setBadgeForTab(tabId: number, count: number): void {
  chrome.runtime
    .sendMessage({ type: 'SET_BADGE', payload: { tabId, count } })
    .catch((error) => logger.error('Failed to set badge', { error }));
}

export function useScanner() {
  // Use selectors for state values
  const isScanning = useScanStore((state) => state.isScanning);
  const scanResult = useScanStore((state) => state.scanResult);
  const error = useScanStore((state) => state.error);
  const selectedAuditType = useScanStore((state) => state.selectedAuditType);

  // Get actions directly from store (these are stable references)
  const setScanning = useScanStore((state) => state.setScanning);
  const setScanResult = useScanStore((state) => state.setScanResult);
  const setError = useScanStore((state) => state.setError);
  const setScannedTabId = useScanStore((state) => state.setScannedTabId);

  // Multi-scan progress state
  const [currentAuditIndex, setCurrentAuditIndex] = useState<number>(0);
  const [totalAudits, setTotalAudits] = useState<number>(0);
  const [currentAuditType, setCurrentAuditType] = useState<AuditType | null>(null);

  // Controller for the in-flight scan; cancelScan() aborts it.
  const abortRef = useRef<AbortController | null>(null);

  // Single scan implementation
  const scanSingle = useCallback(
    async (auditType: string, tabId: number, signal: AbortSignal): Promise<ScanResult> => {
      logger.time(`scan-${auditType}`);

      const timeout = rejectAfter(
        SCAN_TIMEOUT_MS,
        `${auditType} scan timeout after ${SCAN_TIMEOUT_MS / 1000}s`
      );

      let response;
      try {
        // Race the page response against the timeout and a user cancellation, so
        // a hung scan can never leave the panel stuck on the progress screen.
        response = await Promise.race([
          chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE', payload: { auditType } }),
          timeout.promise,
          rejectOnAbort(signal),
        ]);
      } finally {
        timeout.clear();
        logger.timeEnd(`scan-${auditType}`);
      }

      if (response?.success && response.result) {
        return response.result as ScanResult;
      } else {
        throw new Error(response?.error || `${auditType} scan failed`);
      }
    },
    []
  );

  const scan = useCallback(
    async (auditTypeOverride?: string) => {
      const controller = new AbortController();
      abortRef.current = controller;

      setScanning(true);
      setError(null);
      setCurrentAuditIndex(0);
      setTotalAudits(1);

      // Use override if provided, otherwise use store value
      const auditType = auditTypeOverride || selectedAuditType;
      setCurrentAuditType(auditType as AuditType);

      // Allow React to render the loading state before continuing
      await new Promise((resolve) => setTimeout(resolve, 0));

      logger.group(`Scan: ${auditType}`);

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

        // Distinct messaging for non-internal pages that still can't be scanned
        // (Chrome Web Store, view-source:, file://, PDF viewer).
        const unscannable = getUnscannableReason(tab.url);
        if (unscannable) {
          throw new Error(unscannable);
        }

        // Record the scanned tab so highlight/vision/focus target it even after
        // the user switches tabs with the panel open (correctness-4).
        setScannedTabId(tab.id);

        // Ensure content script is loaded (inject on-demand if needed)
        await ensureContentScript(tab.id);

        const result = await scanSingle(auditType, tab.id, controller.signal);
        logger.info('Scan completed', {
          auditType,
          issueCount: result.issues.length,
          duration: `${result.duration}ms`,
        });
        setScanResult(result);
        setBadgeForTab(tab.id, result.summary.total);
      } catch (err) {
        if (controller.signal.aborted) {
          // User cancelled: leave any prior results in place and surface no error.
          logger.info('Scan cancelled by user');
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        const stack = err instanceof Error ? err.stack : undefined;
        logger.error('Scan failed', { error: message, stack });
        setError(message);
        setScanResult(null);
      } finally {
        setScanning(false);
        setCurrentAuditType(null);
        abortRef.current = null;
        logger.groupEnd();
      }
    },
    [selectedAuditType, setScanning, setScanResult, setError, setScannedTabId, scanSingle]
  );

  // Multi-scan: runs multiple audit types sequentially and combines results
  const scanMultiple = useCallback(
    async (auditTypes: AuditType[]) => {
      if (auditTypes.length === 0) return;

      // If only one audit, use regular scan (which manages its own controller)
      if (auditTypes.length === 1) {
        await scan(auditTypes[0]);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setScanning(true);
      setError(null);
      setTotalAudits(auditTypes.length);
      setCurrentAuditIndex(0);

      logger.group('Multi-Scan');
      logger.info('Starting multi-scan', { auditTypes, count: auditTypes.length });

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

        // Distinct messaging for non-internal pages that still can't be scanned
        // (Chrome Web Store, view-source:, file://, PDF viewer).
        const unscannable = getUnscannableReason(tab.url);
        if (unscannable) {
          throw new Error(unscannable);
        }

        // Record the scanned tab so page-directed actions target it (correctness-4).
        setScannedTabId(tab.id);

        // Ensure content script is loaded (inject on-demand if needed)
        await ensureContentScript(tab.id);

        const allIssues: Issue[] = [];
        const allIncomplete: Issue[] = [];
        const errors: string[] = [];
        let successCount = 0;
        let totalDuration = 0;

        // Run each audit sequentially
        for (let i = 0; i < auditTypes.length; i++) {
          const auditType = auditTypes[i];
          setCurrentAuditIndex(i);
          setCurrentAuditType(auditType);

          try {
            const result = await scanSingle(auditType, tab.id, controller.signal);
            totalDuration += result.duration;

            // Tag issues with audit type (add to id to make unique)
            const taggedIssues = result.issues.map((issue) => ({
              ...issue,
              id: `${auditType}-${issue.id}`,
            }));

            const taggedIncomplete = result.incomplete.map((issue) => ({
              ...issue,
              id: `${auditType}-${issue.id}`,
            }));

            allIssues.push(...taggedIssues);
            allIncomplete.push(...taggedIncomplete);
            successCount++;
          } catch (err) {
            // A cancellation must stop the whole multi-scan, not be recorded as a
            // failed audit and skipped past — rethrow to the outer handler.
            if (controller.signal.aborted) throw err;
            const message = err instanceof Error ? err.message : 'Unknown error';
            const stack = err instanceof Error ? err.stack : undefined;
            logger.error(`Audit ${auditType} failed`, { error: message, stack });
            errors.push(`${auditType}: ${message}`);
          }
        }

        // Combine results
        const combinedResult: ScanResult = {
          url: tab.url || '',
          timestamp: Date.now(),
          duration: totalDuration,
          issues: allIssues,
          incomplete: allIncomplete,
          summary: generateCombinedSummary(allIssues),
        };

        logger.info('Multi-scan completed', {
          totalIssues: allIssues.length,
          totalDuration: `${totalDuration}ms`,
          failedAudits: errors.length,
        });

        if (successCount === 0) {
          // Every audit errored — there are no partial results to show, so surface
          // the failure on the error screen rather than an empty result.
          setScanResult(null);
          setError(`All audits failed: ${errors.join('; ')}`);
        } else {
          // At least one audit produced results: keep them and, if some failed,
          // attach a non-blocking message so the partial results stay visible.
          setScanResult(combinedResult);
          // Badge shows the COMBINED total on the scanned tab, overriding the
          // per-audit SCAN_RESULT updates the content script sent (correctness-5).
          setBadgeForTab(tab.id, combinedResult.summary.total);
          if (errors.length > 0) {
            setError(`Some audits failed: ${errors.join('; ')}`);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // User cancelled: leave any prior results in place and surface no error.
          logger.info('Multi-scan cancelled by user');
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        const stack = err instanceof Error ? err.stack : undefined;
        logger.error('Multi-scan failed', { error: message, stack });
        setError(message);
        setScanResult(null);
      } finally {
        setScanning(false);
        setCurrentAuditType(null);
        setCurrentAuditIndex(0);
        setTotalAudits(0);
        abortRef.current = null;
        logger.groupEnd();
      }
    },
    [setScanning, setScanResult, setError, setScannedTabId, scanSingle, scan]
  );

  const clearResults = useCallback(() => {
    setScanResult(null);
    setError(null);
    setScannedTabId(null);
  }, [setScanResult, setError, setScannedTabId]);

  // Abort the in-flight scan (if any). The scan/scanMultiple handlers detect the
  // aborted signal and reset state without recording an error.
  const cancelScan = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    isScanning,
    scanResult,
    error,
    scan,
    scanMultiple,
    cancelScan,
    clearResults,
    // Progress info for multi-scan
    currentAuditIndex,
    totalAudits,
    currentAuditType,
  };
}
