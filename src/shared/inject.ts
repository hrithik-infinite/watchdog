import logger from './logger';

// Fixed output paths from vite.content.config.ts. With no declarative content
// script, the scanner is addressed by a stable path and injected on demand
// rather than discovered from manifest.content_scripts.
const CONTENT_SCRIPT_JS = 'content-script.js';
const CONTENT_SCRIPT_CSS = 'content-script.css';

// Shown when injection fails on a page the extension can otherwise access — e.g.
// the page is still loading, blocks injection, or the activeTab grant lapsed
// (the tab navigated). The "Refresh the page" wording is matched by
// getErrorDetails() to surface error E003.
export const INJECTION_FAILED_MESSAGE =
  'WatchDog could not load the scanner on this page. Refresh the page and scan again.';

/**
 * Ensure the content script is present in `tabId`, injecting it on demand if
 * not. Called from the background service worker for every feature that messages
 * the page (scan, vision filters, focus order) now that there is no always-on
 * `<all_urls>` content script.
 *
 * Host access comes from the `activeTab` grant the toolbar-icon click hands to the
 * background — the panel could never inject this itself. Throws
 * INJECTION_FAILED_MESSAGE if injection still fails (e.g. the grant lapsed).
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
  } catch (error) {
    // Preserve the underlying cause for diagnosis; the user sees the friendly
    // INJECTION_FAILED_MESSAGE while the real error reaches the console.
    logger.error('On-demand injection failed', { tabId, error });
    throw new Error(INJECTION_FAILED_MESSAGE);
  }
}
