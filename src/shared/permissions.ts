import logger from './logger';

// The optional host-permission umbrella declared in manifest.config.ts. Held as
// an OPTIONAL permission (no install-time warning, secpriv-6) and used only as a
// fallback — real requests are scoped per-page below.
const ALL_URLS = '<all_urls>';

// Shown when the user declines Chrome's host-permission prompt. Wording is
// matched by getErrorDetails() to surface error E009.
export const HOST_PERMISSION_DENIED_MESSAGE =
  'WatchDog needs permission to read this page. Choose "Allow" when Chrome asks, then scan again.';

/**
 * Turn a page URL into a host-permission match pattern, e.g.
 * "https://www.youtube.com/*". Returns null for URLs with no http(s) host we can
 * scope to (callers already reject unscannable pages), so the caller falls back
 * to the broad umbrella.
 */
function originPatternForUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, host } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:') return null;
    return `${protocol}//${host}/*`;
  } catch {
    return null;
  }
}

/**
 * Ensure the extension holds host access for `url`'s origin so
 * chrome.scripting.executeScript can inject the scanner, prompting the user with
 * Chrome's native permission dialog the first time that site is scanned.
 *
 * When the page origin is known, the request is SCOPED to it rather than
 * `<all_urls>`, so Chrome's prompt reads "Read and change your data on
 * example.com" and chrome://extensions lists only approved sites. A site already
 * approved short-circuits on permissions.contains() (a prior broad `<all_urls>`
 * grant also satisfies this, so existing users are never re-prompted).
 *
 * CAVEAT: scoping needs `url`. A side panel gets no activeTab grant and the
 * manifest declares no `tabs` permission, so on a COLD first scan of a not-yet-
 * granted site Chrome redacts tab.url (undefined) and `originPatternForUrl`
 * returns null — the request then falls back to the broad `<all_urls>` prompt.
 * Scoping therefore only kicks in once an origin is resolvable (e.g. a re-scan
 * after a grant). Delivering the narrow prompt on the very first scan would
 * require either the `tabs` permission or routing the scan through an
 * activeTab-granting gesture (toolbar action / command) — a deliberate trade-off,
 * not yet taken. See the host-permission note in manifest.config.ts.
 *
 * Required because a side panel opened via the action icon does NOT get the
 * `activeTab` grant — Chrome only grants activeTab for action/context-menu/
 * command/omnibox invocations and deliberately excluded side-panel-open. Without
 * a host grant, executeScript throws and every scan fails with E009.
 *
 * MUST be called synchronously enough after a user gesture (e.g. the Start Scan
 * click) to stay within Chrome's transient-activation window, since
 * permissions.request() requires user activation. Subsequent calls for an
 * already-granted origin short-circuit on permissions.contains() and need no
 * gesture.
 *
 * Throws HOST_PERMISSION_DENIED_MESSAGE if the user declines.
 */
export async function ensureHostAccess(url: string | undefined): Promise<void> {
  const origin = originPatternForUrl(url) ?? ALL_URLS;

  if (await chrome.permissions.contains({ origins: [origin] })) {
    return;
  }

  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    logger.warn('Host permission denied by user', { origin });
    throw new Error(HOST_PERMISSION_DENIED_MESSAGE);
  }
  logger.info('Host permission granted', { origin });
}
