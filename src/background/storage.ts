import type { Settings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/constants';

const SETTINGS_KEY = 'watchdog_settings';

export async function getSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const stored = result[SETTINGS_KEY] as Partial<Settings> | undefined;
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const current = await getSettings();
    await chrome.storage.local.set({
      [SETTINGS_KEY]: { ...current, ...settings },
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
