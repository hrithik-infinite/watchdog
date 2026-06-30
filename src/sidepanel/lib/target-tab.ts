import { getCurrentTab } from '@/shared/messaging';
import { useScanStore } from '../store';

/**
 * The tab that page-directed actions (highlight, vision filter, focus order)
 * should target: the tab that was scanned, not whatever is active now. The side
 * panel persists across tab switches, so the active tab can drift away from the
 * scanned one (correctness-4). Falls back to the active tab when nothing has been
 * scanned yet (e.g. toggling a vision filter before any scan).
 */
export async function getTargetTabId(): Promise<number | undefined> {
  const scanned = useScanStore.getState().scannedTabId;
  if (scanned != null) return scanned;
  return (await getCurrentTab())?.id;
}

/**
 * Like getTargetTabId, but resolves the full tab so callers can read its `url`
 * (e.g. to scope a host-permission request to the page's own origin). Falls back
 * to the active tab if the scanned tab has since been closed.
 */
export async function getTargetTab(): Promise<chrome.tabs.Tab | undefined> {
  const scanned = useScanStore.getState().scannedTabId;
  if (scanned != null) {
    try {
      return await chrome.tabs.get(scanned);
    } catch {
      // Scanned tab is gone (closed/navigated away) — fall back to the active tab.
    }
  }
  return getCurrentTab();
}
