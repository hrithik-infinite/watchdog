/**
 * Storage utilities for WatchDog.
 * Manages ignored-issue persistence in chrome.storage.local.
 */

import logger from './logger';

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
  | 'third-party'
  | 'design-decision'
  | 'false-positive'
  | 'will-fix-later'
  | 'other';

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
