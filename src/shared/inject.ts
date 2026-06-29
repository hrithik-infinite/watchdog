import logger from './logger';

// Fixed output paths from vite.content.config.ts. With no declarative content
// script, the scanner is addressed by a stable path and injected on demand
// rather than discovered from manifest.content_scripts.
const CONTENT_SCRIPT_JS = 'content-script.js';
const CONTENT_SCRIPT_CSS = 'content-script.css';

// Shown when injection fails for lack of an activeTab grant — typically because
// the user switched tabs after opening the side panel. Re-invoking the action
// (clicking the toolbar icon) grants activeTab for the now-active tab. The
// wording is matched by getErrorDetails() to surface error E009.
export const PERMISSION_NEEDED_MESSAGE =
  'WatchDog needs permission for this tab. Click the WatchDog icon in your toolbar, then try again.';

/**
 * Ensure the content script is present in `tabId`, injecting it on demand if
 * not. Used by every feature that messages the page (scan, vision filters,
 * focus order) now that there is no always-on `<all_urls>` content script.
 *
 * Throws PERMISSION_NEEDED_MESSAGE when injection isn't permitted (no activeTab
 * grant for this tab), so callers can guide the user to re-grant access.
 */
export async function ensureContentScript(tabId: number): Promise<void> {
  // Fast path: already injected (same tab, not navigated since).
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    logger.info('Content script already loaded', { tabId });
    return;
  } catch {
    logger.info('Content script not present; injecting on demand', { tabId });
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: [CONTENT_SCRIPT_JS] });
    await chrome.scripting.insertCSS({ target: { tabId }, files: [CONTENT_SCRIPT_CSS] });
    // Confirm the freshly-injected script is responsive before using it.
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    logger.info('Content script injected on demand', { tabId });
  } catch {
    throw new Error(PERMISSION_NEEDED_MESSAGE);
  }
}
