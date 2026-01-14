import { useCallback, useEffect } from 'react';
import { useScanStore } from '../store';
import type { Settings } from '@/shared/types';

export function useSettings() {
  const { settings, updateSettings } = useScanStore();

  // Load settings from storage on mount
  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: 'GET_SETTINGS' })
      .then((response) => {
        if (response?.success && response.settings) {
          updateSettings(response.settings);
        }
      })
      .catch(console.error);
  }, [updateSettings]);

  // Save settings to storage
  const saveSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      updateSettings(newSettings);
      try {
        await chrome.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          payload: newSettings,
        });
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },
    [updateSettings]
  );

  return {
    settings,
    updateSettings: saveSettings,
  };
}
