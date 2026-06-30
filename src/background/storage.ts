import type { Settings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/constants';

const SETTINGS_KEY = 'watchdog_settings';

// Serialize settings writes. chrome.storage.local read-modify-write is non-atomic:
// two interleaved saveSettings calls both read the same baseline and the later
// set() overwrites the earlier patch, silently dropping it. Chaining every save
// onto this promise guarantees each read-modify-write completes before the next.
let settingsWriteChain: Promise<unknown> = Promise.resolve();

function withSettingsLock<T>(task: () => Promise<T>): Promise<T> {
  const run = settingsWriteChain.then(task, task);
  // Swallow chain errors so one failure doesn't block later writers; the caller
  // still observes the real outcome via the returned `run`.
  settingsWriteChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

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
  return withSettingsLock(async () => {
    try {
      const current = await getSettings();
      await chrome.storage.local.set({
        [SETTINGS_KEY]: { ...current, ...settings },
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  });
}
