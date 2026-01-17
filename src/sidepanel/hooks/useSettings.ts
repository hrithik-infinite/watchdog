import { useCallback, useEffect } from 'react';
import { useScanStore } from '../store';
import type { Settings } from '@/shared/types';
import logger from '@/shared/logger';

export function useSettings() {
  const { settings, updateSettings } = useScanStore();

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
      .catch((err) => logger.error('Failed to load settings', { error: err }));
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
    updateSettings: saveSettings,
  };
}
