import { useCallback } from 'react';
import { ensureContentScript } from '@/shared/inject';
import logger from '@/shared/logger';
import type { Settings, VisionMode } from '@/shared/types';
import { getTargetTabId } from '@/sidepanel/lib/target-tab';
import { useScanStore } from '../store';

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
      persist({ visionMode: mode });
      try {
        const tabId = await getTargetTabId();
        if (tabId != null) {
          await ensureContentScript(tabId);
          await chrome.tabs.sendMessage(tabId, { type: 'APPLY_VISION_FILTER', payload: { mode } });
        }
      } catch (error) {
        logger.error('Failed to apply vision filter', { error });
      }
    },
    [persist]
  );

  const setFocusOrder = useCallback(
    async (show: boolean) => {
      persist({ showFocusOrder: show });
      try {
        const tabId = await getTargetTabId();
        if (tabId != null) {
          await ensureContentScript(tabId);
          await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_FOCUS_ORDER', payload: { show } });
        }
      } catch (error) {
        logger.error('Failed to toggle focus order', { error });
      }
    },
    [persist]
  );

  return {
    visionMode: settings.visionMode,
    showFocusOrder: settings.showFocusOrder,
    setVisionMode,
    setFocusOrder,
  };
}
