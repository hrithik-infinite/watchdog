import type { Issue, ScanResult } from '@/shared/types';
import { safeHttpUrl } from '@/shared/url';

// Imported reports are untrusted — the import feature exists to SHARE reports
// between people, so a crafted file can set any field. Clamp every URL that could
// become a clickable href (helpUrl, fix.learnMoreUrl) to http(s) only, here at
// the deserialization boundary, so a `javascript:`/phishing link can't ride an
// imported issue into the trusted side panel. Doing it here means every
// downstream renderer and re-export inherits the guarantee.
function sanitizeIssueUrls(issue: Issue): Issue {
  if (!issue || typeof issue !== 'object') return issue;
  const fix =
    issue.fix && typeof issue.fix === 'object'
      ? { ...issue.fix, learnMoreUrl: safeHttpUrl(issue.fix.learnMoreUrl) }
      : issue.fix;
  return { ...issue, helpUrl: safeHttpUrl(issue.helpUrl), fix };
}

/**
 * Parse a previously-exported WatchDog JSON report back into a ScanResult
 * (feat-compet-8). exportJSON writes the ScanResult verbatim, so this validates
 * the essential shape and fills defensive defaults for optional fields. Throws a
 * user-facing message when the file isn't a WatchDog report.
 */
export function parseReport(text: string): ScanResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a valid WatchDog report — it couldn't be read as JSON.");
  }

  const r = data as Partial<ScanResult> | null;
  if (
    !r ||
    typeof r !== 'object' ||
    typeof r.url !== 'string' ||
    !Array.isArray(r.issues) ||
    typeof r.summary !== 'object' ||
    r.summary === null
  ) {
    throw new Error("That file isn't a WatchDog report.");
  }

  return {
    url: r.url,
    timestamp: typeof r.timestamp === 'number' ? r.timestamp : 0,
    duration: typeof r.duration === 'number' ? r.duration : 0,
    issues: r.issues.map(sanitizeIssueUrls),
    incomplete: Array.isArray(r.incomplete) ? r.incomplete.map(sanitizeIssueUrls) : [],
    summary: r.summary,
  };
}
