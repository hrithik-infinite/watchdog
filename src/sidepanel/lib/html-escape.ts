/**
 * HTML/URL escaping for generated reports. Kept in its own module so both the
 * export entry point (export.ts) and the report template (report-template.ts)
 * share one XSS-critical implementation instead of each carrying a copy.
 */

/**
 * Escape HTML special characters to prevent stored HTML/script injection when
 * interpolating page-derived text into generated reports.
 */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate a page-derived URL for safe use in an href. Only http(s) URLs are
 * allowed through; anything else (javascript:, data:, etc.) collapses to '#'.
 * The returned value is HTML-attribute escaped.
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return escapeHtml(parsed.href);
    }
  } catch {
    // Not a valid absolute URL — fall through to the safe default.
  }
  return '#';
}

/**
 * Validate a page-derived CSS color (e.g. axe's contrast fg/bg) before dropping
 * it into an inline `style`. Only hex / rgb(a) / hsl(a) / bare named colors pass;
 * anything else (which could break out of the declaration) becomes transparent.
 */
export function safeCssColor(value: string): string {
  const v = String(value).trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^rgba?\([\d\s.,%/]+\)$/.test(v)) return v;
  if (/^hsla?\([\d\s.,%/]+\)$/.test(v)) return v;
  if (/^[a-zA-Z]{1,20}$/.test(v)) return v;
  return 'transparent';
}
