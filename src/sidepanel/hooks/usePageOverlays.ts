import { useCallback, useState } from 'react';
import logger from '@/shared/logger';
import type { Settings, VisionMode } from '@/shared/types';
import { useScanStore } from '../store';

// Turn an apply failure into a user-facing line. The background returns
// already-user-facing errors (no armed tab / injection failed); fall back to a
// generic hint otherwise.
function overlayErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'Could not apply this to the page. Scan a page first, then try again.';
}

// Send a page-directed overlay message to the background, which forwards it to the
// armed tab's content script (injecting on demand). Throws if the background could
// not deliver it so callers can roll back the optimistic toggle.
async function applyToPage(message: {
  type: 'APPLY_VISION_FILTER' | 'TOGGLE_FOCUS_ORDER';
  payload: unknown;
}): Promise<void> {
  const response = (await chrome.runtime.sendMessage(message)) as
    | { success?: boolean; error?: string }
    | undefined;
  if (response && response.success === false) {
    throw new Error(response.error || 'Could not apply this to the page.');
  }
}

/**
 * Shared control for the on-page overlays — the vision simulator and the
 * focus-order visualization (ux-public-10). Each setter persists the preference
 * and applies it to the armed tab via the background (which holds activeTab and
 * owns all page interaction now that the panel cannot inject directly). Used by
 * Settings and by the results-view "Experience your site" controls / contrast
 * deep-link so the apply logic lives in exactly one place.
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
        await applyToPage({ type: 'APPLY_VISION_FILTER', payload: { mode } });
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
        await applyToPage({ type: 'TOGGLE_FOCUS_ORDER', payload: { show } });
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
