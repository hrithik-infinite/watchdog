/**
 * Hook for managing ignored issues
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getIgnoredIssuesForDomain,
  unignoreIssue,
  clearIgnoredIssuesForDomain,
  generateIssueHash,
  type IgnoredIssue,
} from '@/shared/storage';

interface UseIgnoredIssuesResult {
  ignoredIssues: IgnoredIssue[];
  ignoredHashes: Set<string>;
  isLoading: boolean;
  ignoredCount: number;
  unignore: (selector: string, ruleId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
  isIgnored: (selector: string, ruleId: string) => boolean;
}

export function useIgnoredIssues(currentUrl: string | undefined): UseIgnoredIssuesResult {
  const [ignoredIssues, setIgnoredIssues] = useState<IgnoredIssue[]>([]);
  const [ignoredHashes, setIgnoredHashes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load ignored issues when URL changes
  const loadIgnoredIssues = useCallback(async () => {
    if (!currentUrl) {
      setIgnoredIssues([]);
      setIgnoredHashes(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const issues = await getIgnoredIssuesForDomain(currentUrl);
      setIgnoredIssues(issues);
      setIgnoredHashes(new Set(issues.map((i) => i.hash)));
    } catch (error) {
      console.error('Failed to load ignored issues:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUrl]);

  useEffect(() => {
    loadIgnoredIssues();
  }, [loadIgnoredIssues]);

  // Unignore a specific issue
  const unignore = useCallback(
    async (selector: string, ruleId: string) => {
      if (!currentUrl) return;
      try {
        await unignoreIssue(currentUrl, selector, ruleId);
        await loadIgnoredIssues();
      } catch (error) {
        console.error('Failed to unignore issue:', error);
      }
    },
    [currentUrl, loadIgnoredIssues]
  );

  // Clear all ignored issues for domain
  const clearAll = useCallback(async () => {
    if (!currentUrl) return;
    try {
      await clearIgnoredIssuesForDomain(currentUrl);
      await loadIgnoredIssues();
    } catch (error) {
      console.error('Failed to clear ignored issues:', error);
    }
  }, [currentUrl, loadIgnoredIssues]);

  // Check if an issue is ignored
  const isIgnored = useCallback(
    (selector: string, ruleId: string): boolean => {
      const hash = generateIssueHash(selector, ruleId);
      return ignoredHashes.has(hash);
    },
    [ignoredHashes]
  );

  return {
    ignoredIssues,
    ignoredHashes,
    isLoading,
    ignoredCount: ignoredIssues.length,
    unignore,
    clearAll,
    refresh: loadIgnoredIssues,
    isIgnored,
  };
}

export default useIgnoredIssues;
