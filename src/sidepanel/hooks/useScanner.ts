import { useCallback, useRef, useState } from 'react';
import { useScanStore, type AuditType } from '../store';
import { getCurrentTab } from '@/shared/messaging';
import type { ScanResult, Issue, ScanSummary, Severity, Category } from '@/shared/types';
import logger from '@/shared/logger';

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

async function ensureContentScriptLoaded(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    logger.info('Content script loaded', { tabId });
    return;
  } catch {
    // Not injected yet — common for tabs that were already open when the
    // extension was installed/updated (the declarative content script only runs
    // on page load). We hold the `scripting` permission, so inject on demand and
    // retry instead of telling the user to refresh.
    logger.info('Content script not present; injecting on demand', { tabId });
  }

  try {
    const contentScript = chrome.runtime.getManifest().content_scripts?.[0];
    const jsFiles = contentScript?.js ?? [];
    const cssFiles = contentScript?.css ?? [];

    if (jsFiles.length > 0) {
      await chrome.scripting.executeScript({ target: { tabId }, files: jsFiles });
    }
    if (cssFiles.length > 0) {
      await chrome.scripting.insertCSS({ target: { tabId }, files: cssFiles });
    }

    // Confirm the freshly-injected script is responsive before scanning.
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    logger.info('Content script injected on demand', { tabId });
  } catch {
    throw new Error('Content script not loaded. Please refresh the page and try again.');
  }
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

        // Ensure content script is loaded (inject on-demand if needed)
        await ensureContentScriptLoaded(tab.id);

        const result = await scanSingle(auditType, tab.id, controller.signal);
        logger.info('Scan completed', {
          auditType,
          issueCount: result.issues.length,
          duration: `${result.duration}ms`,
        });
        setScanResult(result);
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
    [selectedAuditType, setScanning, setScanResult, setError, scanSingle]
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

        // Ensure content script is loaded (inject on-demand if needed)
        await ensureContentScriptLoaded(tab.id);

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
    [setScanning, setScanResult, setError, scanSingle, scan]
  );

  const clearResults = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, [setScanResult, setError]);

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
