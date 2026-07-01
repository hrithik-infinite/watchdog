/**
 * Return `rawUrl` only when it is a syntactically valid http(s) URL; otherwise an
 * empty string. Use at trust boundaries (imported reports, any href built from
 * page- or user-supplied data) to block `javascript:`, `data:`, and other
 * non-navigational schemes before a string reaches an anchor href.
 */
export function safeHttpUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Not a valid absolute URL — fall through to the safe default.
  }
  return '';
}
