import { useCallback, useState } from 'react';
import { useScanStore, type AuditType } from '../store';
import { getCurrentTab } from '@/shared/messaging';
import type { ScanResult, Issue, ScanSummary, Severity, Category } from '@/shared/types';
import logger from '@/shared/logger';

async function checkContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return true;
  } catch {
    logger.warn('Content script not loaded', { tabId });
    return false;
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

  // Single scan implementation
  const scanSingle = useCallback(async (auditType: string, tabId: number): Promise<ScanResult> => {
    logger.time(`scan-${auditType}`);

    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'SCAN_PAGE',
      payload: { auditType },
    });

    logger.timeEnd(`scan-${auditType}`);

    if (response?.success && response.result) {
      return response.result as ScanResult;
    } else {
      throw new Error(response?.error || `${auditType} scan failed`);
    }
  }, []);

  const scan = useCallback(
    async (auditTypeOverride?: string) => {
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

        // Check if content script is loaded
        const isLoaded = await checkContentScriptLoaded(tab.id);
        if (!isLoaded) {
          throw new Error('Please refresh the page and try again');
        }

        const result = await scanSingle(auditType, tab.id);
        logger.info('Scan completed', {
          auditType,
          issueCount: result.issues.length,
          duration: `${result.duration}ms`,
        });
        setScanResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        const stack = err instanceof Error ? err.stack : undefined;
        logger.error('Scan failed', { error: message, stack });
        setError(message);
        setScanResult(null);
      } finally {
        setScanning(false);
        setCurrentAuditType(null);
        logger.groupEnd();
      }
    },
    [selectedAuditType, setScanning, setScanResult, setError, scanSingle]
  );

  // Multi-scan: runs multiple audit types sequentially and combines results
  const scanMultiple = useCallback(
    async (auditTypes: AuditType[]) => {
      if (auditTypes.length === 0) return;

      // If only one audit, use regular scan
      if (auditTypes.length === 1) {
        await scan(auditTypes[0]);
        return;
      }

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

        // Check if content script is loaded
        const isLoaded = await checkContentScriptLoaded(tab.id);
        if (!isLoaded) {
          throw new Error('Please refresh the page and try again');
        }

        const allIssues: Issue[] = [];
        const allIncomplete: Issue[] = [];
        const errors: string[] = [];
        let totalDuration = 0;

        // Run each audit sequentially
        for (let i = 0; i < auditTypes.length; i++) {
          const auditType = auditTypes[i];
          setCurrentAuditIndex(i);
          setCurrentAuditType(auditType);

          try {
            const result = await scanSingle(auditType, tab.id);
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
          } catch (err) {
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

        setScanResult(combinedResult);

        if (errors.length > 0) {
          setError(`Some audits failed: ${errors.join('; ')}`);
        }
      } catch (err) {
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
        logger.groupEnd();
      }
    },
    [setScanning, setScanResult, setError, scanSingle, scan]
  );

  const clearResults = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, [setScanResult, setError]);

  return {
    isScanning,
    scanResult,
    error,
    scan,
    scanMultiple,
    clearResults,
    // Progress info for multi-scan
    currentAuditIndex,
    totalAudits,
    currentAuditType,
  };
}
