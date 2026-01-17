/**
 * Hook for managing scan history
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getScanHistoryForDomain,
  saveScanToHistory,
  type ScanHistoryEntry,
} from '@/shared/storage';
import type { ScanResult } from '@/shared/types';
import type { AuditType } from '@/sidepanel/store';
import logger from '@/shared/logger';

interface UseScanHistoryResult {
  history: ScanHistoryEntry[];
  previousScan: ScanHistoryEntry | null;
  isLoading: boolean;
  saveToHistory: (result: ScanResult, auditTypes?: AuditType[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useScanHistory(currentUrl: string | undefined): UseScanHistoryResult {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [previousScan, setPreviousScan] = useState<ScanHistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load history when URL changes
  const loadHistory = useCallback(async () => {
    if (!currentUrl) {
      setHistory([]);
      setPreviousScan(null);
      return;
    }

    setIsLoading(true);
    logger.debug('Loading scan history', { url: currentUrl });
    try {
      const domainHistory = await getScanHistoryForDomain(currentUrl);
      logger.info('Scan history loaded', { count: domainHistory.length });
      setHistory(domainHistory);

      // Get the previous scan (second most recent)
      if (domainHistory.length > 1) {
        setPreviousScan(domainHistory[1]);
      } else {
        setPreviousScan(null);
      }
    } catch (error) {
      logger.error('Failed to load scan history', { error });
    } finally {
      setIsLoading(false);
    }
  }, [currentUrl]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Save scan to history
  const saveToHistoryCallback = useCallback(
    async (result: ScanResult, auditTypes: AuditType[] = ['accessibility']) => {
      logger.debug('Saving scan to history', { url: result.url, auditTypes });
      try {
        await saveScanToHistory(result, auditTypes);
        logger.info('Scan saved to history');
        await loadHistory();
      } catch (error) {
        logger.error('Failed to save scan to history', { error });
      }
    },
    [loadHistory]
  );

  return {
    history,
    previousScan,
    isLoading,
    saveToHistory: saveToHistoryCallback,
    refresh: loadHistory,
  };
}

export default useScanHistory;
