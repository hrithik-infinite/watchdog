import { useCallback, useEffect, useState } from 'react';
import logger from '@/shared/logger';
import type { Settings } from '@/shared/types';
import { useScanStore } from '../store';

export function useSettings() {
  const { settings, updateSettings } = useScanStore();
  // Whether the initial load from storage has resolved. Gates first-run UI (the
  // onboarding tour) so returning users — whose stored `hasSeenOnboarding` is
  // true — don't see it flash before storage loads.
  const [loaded, setLoaded] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    logger.debug('Loading settings from storage');
    chrome.runtime
      .sendMessage({ type: 'GET_SETTINGS' })
      .then((response) => {
        if (response?.success && response.settings) {
          logger.info('Settings loaded', response.settings);
          updateSettings(response.settings);
        }
      })
      .catch((err) => logger.error('Failed to load settings', { error: err }))
      .finally(() => setLoaded(true));
  }, [updateSettings]);

  // Save settings to storage
  const saveSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      logger.info('Saving settings', newSettings);
      updateSettings(newSettings);
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          payload: newSettings,
        });
        logger.debug('Settings saved successfully');
      } catch (error) {
        logger.error('Failed to save settings', { error });
      }
    },
    [updateSettings]
  );

  return {
    settings,
    loaded,
    updateSettings: saveSettings,
  };
}
