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
