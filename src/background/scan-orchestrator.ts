import { ensureContentScript } from '@/shared/inject';
import logger from '@/shared/logger';
import type { AuditType, ScanResponse } from '@/shared/messaging';
import type { Category, Issue, ScanResult, ScanSummary, Severity } from '@/shared/types';
import { getArmedTab } from './armed-tab';
import { updateBadge } from './badge';

// A single audit must not hang forever (e.g. axe.run on a huge DOM). After this
// budget the audit is failed with a timeout (surfaced as E004) so the UI recovers.
const SCAN_TIMEOUT_MS = 30000;

// Shown when a scan is requested but no tab is armed — the armed tab navigated or
// closed (revoking activeTab), or the panel outlived its grant. Falls through
// getErrorDetails() to E005, which preserves this actionable message verbatim.
export const NO_ARMED_TAB_MESSAGE =
  'Click the WatchDog toolbar icon on the page you want to scan, then scan again.';

// Rejects after `ms`; returns a clear() so the timer never outlives the scan.
function rejectAfter(ms: number, message: string): { promise: Promise<never>; clear: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return { promise, clear: () => clearTimeout(timer) };
}

// Rejects as soon as the signal aborts, so a user Cancel interrupts an in-flight
// (possibly hung) audit instead of waiting for it to resolve.
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
// internal-page check) yet still cannot be scanned: the Chrome Web Store blocks
// content scripts, and view-source:/file:/PDF tabs have no scannable HTML DOM.
// Return a DISTINCT, actionable message for each so the user learns *why*. The
// returned text flows through getErrorDetails() (falls through to E005, which
// preserves the message verbatim). Returns null when the URL is scannable.
//
// Unlike the old panel implementation, `url` is always a real string here: the
// toolbar click grants activeTab, so the background can read the armed tab's URL
// (a side panel could not, which is why these guards silently no-opped before).
function getUnscannableReason(url: string): string | null {
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

// Generate a combined summary from the issues of every audit in a multi-scan.
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
  for (const issue of issues) {
    bySeverity[issue.severity]++;
    byCategory[issue.category]++;
  }
  return { total: issues.length, bySeverity, byCategory };
}

// Stream progress to the panel so its multi-scan UI can advance. Fire-and-forget:
// the panel may be closed (no receiver), so swallow the "no connection" rejection.
function emitProgress(index: number, total: number, auditType: AuditType): void {
  chrome.runtime
    .sendMessage({ type: 'SCAN_PROGRESS', payload: { index, total, auditType } })
    .catch(() => {
      /* panel not listening — progress is advisory */
    });
}

// Run one audit against the armed tab's content script, racing the response
// against the timeout and the user's cancellation.
async function scanSingle(
  tabId: number,
  auditType: AuditType,
  signal: AbortSignal
): Promise<ScanResult> {
  const timeout = rejectAfter(
    SCAN_TIMEOUT_MS,
    `${auditType} scan timeout after ${SCAN_TIMEOUT_MS / 1000}s`
  );
  let response: ScanResponse | undefined;
  try {
    response = (await Promise.race([
      chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE', payload: { auditType } }),
      timeout.promise,
      rejectOnAbort(signal),
    ])) as ScanResponse;
  } finally {
    timeout.clear();
  }
  if (response?.success && response.result) {
    return response.result;
  }
  throw new Error(response?.error || `${auditType} scan failed`);
}

export interface ScanOutcome {
  result: ScanResult;
  // Set when some (but not all) audits failed in a multi-scan — the panel shows
  // the partial results plus a non-blocking banner.
  partialError?: string;
}

/**
 * Orchestrate a scan of the armed tab from the background service worker — the
 * context that holds the activeTab grant. Resolves the armed tab, runs the
 * restricted-page guards (now effective, because the URL is readable here),
 * injects the scanner on demand, runs each requested audit, sets the badge, and
 * returns the (combined, for multi-audit) result.
 *
 * Throws when there is no armed tab, the page is unscannable, every audit fails,
 * or the user cancels — the caller maps these to a user-facing error.
 */
export async function runScan(auditTypes: AuditType[], signal: AbortSignal): Promise<ScanOutcome> {
  const armed = await getArmedTab();
  if (!armed) {
    throw new Error(NO_ARMED_TAB_MESSAGE);
  }
  const { id: tabId, url } = armed;

  // Internal-page guard — now actually reachable (url is real, not redacted).
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:')
  ) {
    throw new Error('Cannot scan browser internal pages');
  }
  const unscannable = getUnscannableReason(url);
  if (unscannable) {
    throw new Error(unscannable);
  }

  // Inject the scanner on demand under the activeTab grant.
  await ensureContentScript(tabId);

  // Single audit: return the content script's own result verbatim (its url is the
  // page's own window.location.href, and it carries per-rule `incomplete`).
  if (auditTypes.length === 1) {
    const auditType = auditTypes[0];
    emitProgress(0, 1, auditType);
    const result = await scanSingle(tabId, auditType, signal);
    await updateBadge(tabId, result.summary.total);
    logger.info('Scan completed', { auditType, issueCount: result.issues.length });
    return { result };
  }

  // Multi-audit: run each sequentially, tag issue ids by audit, and combine.
  const allIssues: Issue[] = [];
  const allIncomplete: Issue[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let totalDuration = 0;

  for (let i = 0; i < auditTypes.length; i++) {
    const auditType = auditTypes[i];
    emitProgress(i, auditTypes.length, auditType);
    try {
      const result = await scanSingle(tabId, auditType, signal);
      totalDuration += result.duration;
      allIssues.push(
        ...result.issues.map((issue) => ({ ...issue, id: `${auditType}-${issue.id}` }))
      );
      allIncomplete.push(
        ...result.incomplete.map((issue) => ({ ...issue, id: `${auditType}-${issue.id}` }))
      );
      successCount++;
    } catch (err) {
      // A cancellation aborts the whole multi-scan; rethrow to the caller.
      if (signal.aborted) throw err;
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Audit ${auditType} failed`, { error: message });
      errors.push(`${auditType}: ${message}`);
    }
  }

  if (successCount === 0) {
    throw new Error(`All audits failed: ${errors.join('; ')}`);
  }

  const result: ScanResult = {
    url,
    timestamp: Date.now(),
    duration: totalDuration,
    issues: allIssues,
    incomplete: allIncomplete,
    summary: generateCombinedSummary(allIssues),
  };
  await updateBadge(tabId, result.summary.total);
  logger.info('Multi-scan completed', {
    totalIssues: allIssues.length,
    failedAudits: errors.length,
  });

  return {
    result,
    partialError: errors.length > 0 ? `Some audits failed: ${errors.join('; ')}` : undefined,
  };
}
