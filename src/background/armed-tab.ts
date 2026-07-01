import logger from '@/shared/logger';
import type { ArmedTabInfo } from '@/shared/messaging';

// The "armed" tab is the tab whose toolbar icon the user last clicked. That click
// (chrome.action.onClicked) is what grants the extension its activeTab host access
// for that tab — access a side panel can never obtain on its own. Every
// page-touching operation (scan, overlays, highlights) targets this tab, because
// it is the only tab we hold access to.
//
// The grant is held by Chrome and persists until the tab navigates to a different
// origin or closes — it outlives the service worker. The worker's in-memory
// `armedTab`, however, is lost whenever the SW is torn down, so it is mirrored to
// chrome.storage.session and re-hydrated on first read. (session storage is
// in-memory, cleared on browser shutdown, and gated to trusted contexts — the
// panel and background — so no content script can read the armed URL.)
const ARMED_TAB_KEY = 'watchdog_armed_tab';

let armedTab: ArmedTabInfo | null = null;
let hydrated = false;

async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const stored = await chrome.storage.session.get(ARMED_TAB_KEY);
    const value = stored[ARMED_TAB_KEY] as ArmedTabInfo | undefined;
    if (value) armedTab = value;
  } catch (error) {
    logger.error('Failed to hydrate armed tab', { error });
  }
  hydrated = true;
}

/** Record the tab the user just invoked the action on as the armed tab. */
export async function armTab(tab: ArmedTabInfo): Promise<void> {
  armedTab = { id: tab.id, url: tab.url };
  hydrated = true;
  try {
    await chrome.storage.session.set({ [ARMED_TAB_KEY]: armedTab });
  } catch (error) {
    logger.error('Failed to persist armed tab', { error });
  }
  logger.info('Tab armed', { tabId: tab.id });
}

/** The currently armed tab, or null if none is armed (or it lapsed). */
export async function getArmedTab(): Promise<ArmedTabInfo | null> {
  await hydrate();
  return armedTab;
}

/**
 * Forget the armed tab if `tabId` matches it. Called when the tab navigates or
 * closes — either of which revokes the activeTab grant, so continuing to treat it
 * as armed would only produce failed injections.
 */
export async function disarmTab(tabId: number): Promise<void> {
  await hydrate();
  if (armedTab?.id !== tabId) return;
  armedTab = null;
  try {
    await chrome.storage.session.remove(ARMED_TAB_KEY);
  } catch (error) {
    logger.error('Failed to clear armed tab', { error });
  }
  logger.info('Tab disarmed', { tabId });
}
