import type { ScanResult } from '@/shared/types';

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
    issues: r.issues,
    incomplete: Array.isArray(r.incomplete) ? r.incomplete : [],
    summary: r.summary,
  };
}
