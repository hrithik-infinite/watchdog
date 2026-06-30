import logger from './logger';

// Matches optional_host_permissions in manifest.config.ts. Requested at runtime
// (not at install) so the install prompt stays warning-free (secpriv-6), while
// still giving the on-demand scanner real host access to inject into pages.
const ALL_URLS = '<all_urls>';

// Shown when the user declines Chrome's host-permission prompt. Wording is
// matched by getErrorDetails() to surface error E009.
export const HOST_PERMISSION_DENIED_MESSAGE =
  'WatchDog needs permission to read this page. Choose "Allow" when Chrome asks, then scan again.';

/**
 * Ensure the extension holds host access so chrome.scripting.executeScript can
 * inject the scanner, prompting the user with Chrome's native permission dialog
 * the first time.
 *
 * This is required because a side panel opened via the action icon does NOT get
 * the `activeTab` grant — Chrome only grants activeTab for action/context-menu/
 * command/omnibox invocations and deliberately excluded side-panel-open. Without
 * a host grant, executeScript throws and every scan fails with E009. We hold
 * `<all_urls>` as an OPTIONAL host permission (no install-time warning) and
 * request it on demand here.
 *
 * MUST be called synchronously enough after a user gesture (e.g. the Start Scan
 * click) to stay within Chrome's transient-activation window, since
 * permissions.request() requires user activation. Subsequent calls short-circuit
 * on permissions.contains() and need no gesture.
 *
 * Throws HOST_PERMISSION_DENIED_MESSAGE if the user declines.
 */
export async function ensureHostAccess(): Promise<void> {
  if (await chrome.permissions.contains({ origins: [ALL_URLS] })) {
    return;
  }

  const granted = await chrome.permissions.request({ origins: [ALL_URLS] });
  if (!granted) {
    logger.warn('Host permission denied by user');
    throw new Error(HOST_PERMISSION_DENIED_MESSAGE);
  }
  logger.info('Host permission granted');
}
