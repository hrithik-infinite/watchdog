import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Settings } from '@/shared/types';
import { getSettings, saveSettings } from '../storage';

const get = vi.fn();
const set = vi.fn();

vi.stubGlobal('chrome', {
  storage: { local: { get, set } },
});

const KEY = 'watchdog_settings';

describe('background/storage (settings)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({});
    set.mockResolvedValue(undefined);
  });

  describe('getSettings', () => {
    it('returns the defaults when nothing is stored', async () => {
      get.mockResolvedValue({});
      await expect(getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
    });

    it('merges stored values over the defaults', async () => {
      get.mockResolvedValue({ [KEY]: { wcagLevel: 'AAA', persona: 'developer' } });
      const settings = await getSettings();
      expect(settings.wcagLevel).toBe('AAA');
      expect(settings.persona).toBe('developer');
      // Unspecified keys fall back to defaults.
      expect(settings.autoHighlight).toBe(DEFAULT_SETTINGS.autoHighlight);
    });

    it('falls back to defaults when chrome.storage throws', async () => {
      get.mockRejectedValue(new Error('storage unavailable'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('saveSettings', () => {
    it('merges the patch over current settings and writes the whole object', async () => {
      get.mockResolvedValue({ [KEY]: { ...DEFAULT_SETTINGS, wcagLevel: 'A' } });
      await saveSettings({ persona: 'developer' });

      expect(set).toHaveBeenCalledTimes(1);
      const written = set.mock.calls[0][0][KEY];
      expect(written.persona).toBe('developer');
      expect(written.wcagLevel).toBe('A'); // preserved from current
      expect(written.visionMode).toBe(DEFAULT_SETTINGS.visionMode);
    });

    it('swallows write errors', async () => {
      set.mockRejectedValueOnce(new Error('quota exceeded'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(saveSettings({ wcagLevel: 'AAA' })).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('serializes concurrent saves so neither patch is clobbered (correctness-7)', async () => {
      // Buggy behavior: read-modify-write on chrome.storage.local was non-atomic.
      // Two concurrent saveSettings calls both read the same baseline, so the
      // second set() overwrote the first patch (e.g. wcagLevel was lost). Writes
      // are now serialized so both patches accumulate.
      let store: Partial<Settings> = { ...DEFAULT_SETTINGS };
      get.mockImplementation(async () => ({ [KEY]: store }));
      set.mockImplementation(async (obj: Record<string, Partial<Settings>>) => {
        store = obj[KEY];
      });

      await Promise.all([
        saveSettings({ wcagLevel: 'AAA' }),
        saveSettings({ persona: 'developer' }),
      ]);

      expect(store.wcagLevel).toBe('AAA');
      expect(store.persona).toBe('developer');
    });
  });
});
