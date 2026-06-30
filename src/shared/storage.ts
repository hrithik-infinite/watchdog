/**
 * Storage utilities for WatchDog
 * Manages scan history persistence in Chrome storage
 */

import type { ScanResult, Issue, ScanSummary } from './types';
import type { AuditType } from '@/sidepanel/store';
import logger from './logger';

// Storage keys
const SCAN_HISTORY_KEY = 'watchdog_scan_history';
const MAX_HISTORY_PER_DOMAIN = 10;
// Global cap across all domains. Without this, otherHistory (entries from other
// domains) grows unbounded as the user scans many sites and can blow the
// chrome.storage.local quota.
const MAX_TOTAL_HISTORY = 100;

/**
 * Scan history entry stored in Chrome storage
 */
export interface ScanHistoryEntry {
  id: string;
  url: string;
  domain: string;
  auditTypes: AuditType[];
  timestamp: number;
  duration: number;
  summary: ScanSummary;
  issueCount: number;
  issues: Issue[];
}

/**
 * Generate unique ID for history entries
 */
function generateId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Save scan result to history
 */
export async function saveScanToHistory(
  result: ScanResult,
  auditTypes: AuditType[] = ['accessibility']
): Promise<ScanHistoryEntry> {
  const domain = getDomain(result.url);
  logger.debug('Saving scan to history', { domain, auditTypes, issueCount: result.issues.length });

  const entry: ScanHistoryEntry = {
    id: generateId(),
    url: result.url,
    domain,
    auditTypes,
    timestamp: result.timestamp,
    duration: result.duration,
    summary: result.summary,
    issueCount: result.issues.length,
    issues: result.issues,
  };

  // Get existing history
  const allHistory = await getAllScanHistory();

  // Filter history for this domain and keep only last N-1 entries
  const domainHistory = allHistory.filter((e) => e.domain === domain);
  const otherHistory = allHistory.filter((e) => e.domain !== domain);

  // Keep only the most recent entries for this domain
  const trimmedDomainHistory = domainHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_HISTORY_PER_DOMAIN - 1);

  // Add new entry
  let updatedHistory = [...otherHistory, ...trimmedDomainHistory, entry];

  // Size guard: cap total stored history across all domains so it can't grow
  // unbounded and blow the storage quota. Keep the most recent entries globally,
  // but always preserve the entry we just created even if its timestamp is old.
  if (updatedHistory.length > MAX_TOTAL_HISTORY) {
    const capped = [...updatedHistory]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_TOTAL_HISTORY);
    if (!capped.some((e) => e.id === entry.id)) {
      capped[capped.length - 1] = entry;
    }
    updatedHistory = capped;
  }

  // Save to storage. set() was previously unguarded — a QuotaExceeded rejection
  // would propagate and crash the scan-save flow. Catch it and retry with only
  // this domain's recent entries, dropping other domains to free quota.
  try {
    await chrome.storage.local.set({ [SCAN_HISTORY_KEY]: updatedHistory });
    logger.debug('Scan history saved', { entryId: entry.id, totalEntries: updatedHistory.length });
  } catch (error) {
    logger.warn('Failed to save scan history, pruning other domains and retrying', { error });
    const fallback = [...trimmedDomainHistory, entry]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_PER_DOMAIN);
    try {
      await chrome.storage.local.set({ [SCAN_HISTORY_KEY]: fallback });
    } catch (retryError) {
      logger.error('Failed to save scan history after pruning', { error: retryError });
    }
  }

  return entry;
}

/**
 * Get all scan history
 */
export async function getAllScanHistory(): Promise<ScanHistoryEntry[]> {
  const result = await chrome.storage.local.get(SCAN_HISTORY_KEY);
  const history = result[SCAN_HISTORY_KEY];
  return Array.isArray(history) ? history : [];
}

/**
 * Get scan history for a specific domain
 */
export async function getScanHistoryForDomain(url: string): Promise<ScanHistoryEntry[]> {
  const domain = getDomain(url);
  const allHistory = await getAllScanHistory();
  return allHistory.filter((e) => e.domain === domain).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get the most recent scan for a domain (excluding current)
 */
export async function getPreviousScan(
  url: string,
  excludeTimestamp?: number
): Promise<ScanHistoryEntry | null> {
  const history = await getScanHistoryForDomain(url);
  const filtered = excludeTimestamp
    ? history.filter((e) => e.timestamp !== excludeTimestamp)
    : history;
  return filtered[0] || null;
}

/**
 * Delete a scan history entry
 */
export async function deleteScanFromHistory(id: string): Promise<void> {
  const allHistory = await getAllScanHistory();
  const updatedHistory = allHistory.filter((e) => e.id !== id);
  await chrome.storage.local.set({ [SCAN_HISTORY_KEY]: updatedHistory });
}

/**
 * Clear all scan history for a domain
 */
export async function clearDomainHistory(url: string): Promise<void> {
  const domain = getDomain(url);
  const allHistory = await getAllScanHistory();
  const updatedHistory = allHistory.filter((e) => e.domain !== domain);
  await chrome.storage.local.set({ [SCAN_HISTORY_KEY]: updatedHistory });
}

/**
 * Clear all scan history
 */
export async function clearAllHistory(): Promise<void> {
  await chrome.storage.local.remove(SCAN_HISTORY_KEY);
}

/**
 * Comparison result between two scans
 */
export interface ScanComparison {
  current: ScanHistoryEntry;
  previous: ScanHistoryEntry;
  diff: {
    totalDiff: number;
    bySeverity: {
      critical: number;
      serious: number;
      moderate: number;
      minor: number;
    };
  };
  fixedIssues: Issue[];
  newIssues: Issue[];
  unchangedCount: number;
}

/**
 * Generate issue hash for comparison
 * Uses selector + ruleId to identify unique issues
 */
function getIssueHash(issue: Issue): string {
  return `${issue.element.selector}::${issue.ruleId}`;
}

/**
 * Build per-issue comparison keys that are unique even when several issues share
 * the same `selector::ruleId` hash. A plain Set keyed only on the hash collapsed
 * duplicates into one, so a scan with N identical-hash issues counted as 1 —
 * miscounting added/removed/fixed. Appending an occurrence index gives multiset
 * semantics: the k-th occurrence of a hash in current is "unchanged" iff a k-th
 * occurrence exists in previous.
 */
function buildIssueKeys(issues: Issue[]): string[] {
  const seen = new Map<string, number>();
  return issues.map((issue) => {
    const hash = getIssueHash(issue);
    const index = seen.get(hash) ?? 0;
    seen.set(hash, index + 1);
    return `${hash}#${index}`;
  });
}

/**
 * Compare two scans and calculate differences
 */
export function compareScanResults(
  current: ScanResult | ScanHistoryEntry,
  previous: ScanHistoryEntry
): ScanComparison {
  const currentEntry: ScanHistoryEntry =
    'id' in current
      ? current
      : {
          id: 'current',
          url: current.url,
          domain: getDomain(current.url),
          auditTypes: ['accessibility'],
          timestamp: current.timestamp,
          duration: current.duration,
          summary: current.summary,
          issueCount: current.issues.length,
          issues: current.issues,
        };

  // Build occurrence-indexed keys so duplicate `selector::ruleId` hashes don't
  // collide in the Set and undercount the diff.
  const currentKeys = buildIssueKeys(currentEntry.issues);
  const previousKeys = buildIssueKeys(previous.issues);
  const currentKeySet = new Set(currentKeys);
  const previousKeySet = new Set(previousKeys);

  // Find fixed issues (in previous but not in current)
  const fixedIssues = previous.issues.filter((_, i) => !currentKeySet.has(previousKeys[i]));

  // Find new issues (in current but not in previous)
  const newIssues = currentEntry.issues.filter((_, i) => !previousKeySet.has(currentKeys[i]));

  // Unchanged issues
  const unchangedCount = currentEntry.issues.filter((_, i) =>
    previousKeySet.has(currentKeys[i])
  ).length;

  // Calculate severity diffs
  const diff = {
    totalDiff: currentEntry.issueCount - previous.issueCount,
    bySeverity: {
      critical: currentEntry.summary.bySeverity.critical - previous.summary.bySeverity.critical,
      serious: currentEntry.summary.bySeverity.serious - previous.summary.bySeverity.serious,
      moderate: currentEntry.summary.bySeverity.moderate - previous.summary.bySeverity.moderate,
      minor: currentEntry.summary.bySeverity.minor - previous.summary.bySeverity.minor,
    },
  };

  return {
    current: currentEntry,
    previous,
    diff,
    fixedIssues,
    newIssues,
    unchangedCount,
  };
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return new Date(timestamp).toLocaleDateString();
}

// ============================================
// IGNORED ISSUES STORAGE
// ============================================

const IGNORED_ISSUES_KEY = 'watchdog_ignored_issues';

// Serialize ignored-issue writes. chrome.storage.local read-modify-write is
// non-atomic: two interleaved ignoreIssue/unignoreIssue calls both read the same
// baseline and the later set() clobbers the earlier one, silently losing data.
// Chaining every write onto this promise guarantees each read-modify-write runs
// to completion before the next begins.
let ignoredWriteChain: Promise<unknown> = Promise.resolve();

function withIgnoredIssuesLock<T>(task: () => Promise<T>): Promise<T> {
  // Run regardless of whether the previous task resolved or rejected.
  const run = ignoredWriteChain.then(task, task);
  // Swallow errors on the chain so one failure doesn't block later writers; the
  // caller still observes the real outcome via the returned `run`.
  ignoredWriteChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * Reason for ignoring an issue
 */
export type IgnoreReason =
  'third-party' | 'design-decision' | 'false-positive' | 'will-fix-later' | 'other';

export const IGNORE_REASON_LABELS: Record<IgnoreReason, string> = {
  'third-party': "Third-party code (can't modify)",
  'design-decision': 'Design decision (intentional)',
  'false-positive': 'False positive',
  'will-fix-later': 'Will fix later',
  other: 'Other',
};

/**
 * Ignored issue entry
 */
export interface IgnoredIssue {
  hash: string; // selector + ruleId hash
  selector: string;
  ruleId: string;
  message: string;
  reason: IgnoreReason;
  customNote?: string;
  ignoredAt: number;
  domain: string;
}

/**
 * Generate hash for an issue (used for comparison across scans)
 */
export function generateIssueHash(selector: string, ruleId: string): string {
  return `${selector}::${ruleId}`;
}

/**
 * Get all ignored issues
 */
export async function getAllIgnoredIssues(): Promise<IgnoredIssue[]> {
  const result = await chrome.storage.local.get(IGNORED_ISSUES_KEY);
  const ignored = result[IGNORED_ISSUES_KEY];
  return Array.isArray(ignored) ? ignored : [];
}

/**
 * Get ignored issues for a specific domain
 */
export async function getIgnoredIssuesForDomain(url: string): Promise<IgnoredIssue[]> {
  const domain = getDomain(url);
  const allIgnored = await getAllIgnoredIssues();
  return allIgnored.filter((i) => i.domain === domain);
}

/**
 * Check if an issue is ignored
 */
export async function isIssueIgnored(
  url: string,
  selector: string,
  ruleId: string
): Promise<boolean> {
  const hash = generateIssueHash(selector, ruleId);
  const domain = getDomain(url);
  const allIgnored = await getAllIgnoredIssues();
  return allIgnored.some((i) => i.hash === hash && i.domain === domain);
}

/**
 * Add an issue to the ignored list
 */
export async function ignoreIssue(
  url: string,
  selector: string,
  ruleId: string,
  message: string,
  reason: IgnoreReason,
  customNote?: string
): Promise<void> {
  const domain = getDomain(url);
  const hash = generateIssueHash(selector, ruleId);
  logger.debug('Ignoring issue', { domain, ruleId, reason });

  const entry: IgnoredIssue = {
    hash,
    selector,
    ruleId,
    message,
    reason,
    customNote,
    ignoredAt: Date.now(),
    domain,
  };

  await withIgnoredIssuesLock(async () => {
    const allIgnored = await getAllIgnoredIssues();

    // Remove any existing entry with same hash and domain
    const filtered = allIgnored.filter((i) => !(i.hash === hash && i.domain === domain));

    await chrome.storage.local.set({ [IGNORED_ISSUES_KEY]: [...filtered, entry] });
  });
  logger.info('Issue ignored', { hash, reason });
}

/**
 * Remove an issue from the ignored list
 */
export async function unignoreIssue(url: string, selector: string, ruleId: string): Promise<void> {
  const domain = getDomain(url);
  const hash = generateIssueHash(selector, ruleId);
  logger.debug('Unignoring issue', { domain, ruleId, hash });
  await withIgnoredIssuesLock(async () => {
    const allIgnored = await getAllIgnoredIssues();
    const filtered = allIgnored.filter((i) => !(i.hash === hash && i.domain === domain));
    await chrome.storage.local.set({ [IGNORED_ISSUES_KEY]: filtered });
  });
  logger.info('Issue unignored', { hash });
}

/**
 * Clear all ignored issues for a domain
 */
export async function clearIgnoredIssuesForDomain(url: string): Promise<void> {
  const domain = getDomain(url);
  await withIgnoredIssuesLock(async () => {
    const allIgnored = await getAllIgnoredIssues();
    const filtered = allIgnored.filter((i) => i.domain !== domain);
    await chrome.storage.local.set({ [IGNORED_ISSUES_KEY]: filtered });
  });
}

/**
 * Clear all ignored issues
 */
export async function clearAllIgnoredIssues(): Promise<void> {
  // Route through the lock so a clear-all isn't reordered ahead of queued writes.
  await withIgnoredIssuesLock(() => chrome.storage.local.remove(IGNORED_ISSUES_KEY));
}
