/**
 * Storage utilities for WatchDog
 * Manages scan history persistence in Chrome storage
 */

import type { ScanResult, Issue, ScanSummary } from './types';
import type { AuditType } from '@/sidepanel/store';

// Storage keys
const SCAN_HISTORY_KEY = 'watchdog_scan_history';
const MAX_HISTORY_PER_DOMAIN = 10;

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
  const updatedHistory = [...otherHistory, ...trimmedDomainHistory, entry];

  // Save to storage
  await chrome.storage.local.set({ [SCAN_HISTORY_KEY]: updatedHistory });

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
  return allHistory
    .filter((e) => e.domain === domain)
    .sort((a, b) => b.timestamp - a.timestamp);
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

  // Create hash sets for comparison
  const currentHashes = new Set(currentEntry.issues.map(getIssueHash));
  const previousHashes = new Set(previous.issues.map(getIssueHash));

  // Find fixed issues (in previous but not in current)
  const fixedIssues = previous.issues.filter((issue) => !currentHashes.has(getIssueHash(issue)));

  // Find new issues (in current but not in previous)
  const newIssues = currentEntry.issues.filter((issue) => !previousHashes.has(getIssueHash(issue)));

  // Unchanged issues
  const unchangedCount = currentEntry.issues.filter((issue) =>
    previousHashes.has(getIssueHash(issue))
  ).length;

  // Calculate severity diffs
  const diff = {
    totalDiff: currentEntry.issueCount - previous.issueCount,
    bySeverity: {
      critical:
        currentEntry.summary.bySeverity.critical - previous.summary.bySeverity.critical,
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
