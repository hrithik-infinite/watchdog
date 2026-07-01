import { useCallback, useState } from 'react';
import { ensureContentScript } from '@/shared/inject';
import logger from '@/shared/logger';
import { ensureHostAccess } from '@/shared/permissions';
import type { Settings, VisionMode } from '@/shared/types';
import { getTargetTab } from '@/sidepanel/lib/target-tab';
import { useScanStore } from '../store';

// Turn an apply failure into a user-facing line. The thrown errors are already
// user-facing (HOST_PERMISSION_DENIED_MESSAGE / INJECTION_FAILED_MESSAGE).
function overlayErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'Could not apply this to the page. Scan a page first, then try again.';
}

/**
 * Shared control for the on-page overlays — the vision simulator and the
 * focus-order visualization (ux-public-10). Each setter persists the preference
 * and applies it to the active tab (injecting the content script on demand,
 * since there's no longer an always-on script). Used by Settings and by the
 * results-view "Experience your site" controls / contrast deep-link so the apply
 * logic lives in exactly one place.
 */
export function usePageOverlays() {
  const settings = useScanStore((s) => s.settings);
  const updateSettings = useScanStore((s) => s.updateSettings);
  // Surfaced to the UI so an apply failure isn't silent. logger.error is dev-only
  // (stripped in production), so without this the toggle would flip on and the
  // page would never change with no feedback.
  const [overlayError, setOverlayError] = useState<string | null>(null);

  const persist = useCallback(
    (patch: Partial<Settings>) => {
      updateSettings(patch);
      chrome.runtime
        .sendMessage({ type: 'UPDATE_SETTINGS', payload: patch })
        .catch((error) => logger.error('Failed to persist overlay setting', { error }));
    },
    [updateSettings]
  );

  const setVisionMode = useCallback(
    async (mode: VisionMode) => {
      const previous = settings.visionMode;
      setOverlayError(null);
      persist({ visionMode: mode });
      try {
        const tab = await getTargetTab();
        if (tab?.id != null) {
          await ensureHostAccess(tab.url);
          await ensureContentScript(tab.id);
          await chrome.tabs.sendMessage(tab.id, { type: 'APPLY_VISION_FILTER', payload: { mode } });
        }
      } catch (error) {
        logger.error('Failed to apply vision filter', { error });
        // Roll back the optimistic toggle so the control reflects reality.
        persist({ visionMode: previous });
        setOverlayError(overlayErrorMessage(error));
      }
    },
    [persist, settings.visionMode]
  );

  const setFocusOrder = useCallback(
    async (show: boolean) => {
      const previous = settings.showFocusOrder;
      setOverlayError(null);
      persist({ showFocusOrder: show });
      try {
        const tab = await getTargetTab();
        if (tab?.id != null) {
          await ensureHostAccess(tab.url);
          await ensureContentScript(tab.id);
          await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_FOCUS_ORDER', payload: { show } });
        }
      } catch (error) {
        logger.error('Failed to toggle focus order', { error });
        persist({ showFocusOrder: previous });
        setOverlayError(overlayErrorMessage(error));
      }
    },
    [persist, settings.showFocusOrder]
  );

  const clearOverlayError = useCallback(() => setOverlayError(null), []);

  return {
    visionMode: settings.visionMode,
    showFocusOrder: settings.showFocusOrder,
    setVisionMode,
    setFocusOrder,
    overlayError,
    clearOverlayError,
  };
}
