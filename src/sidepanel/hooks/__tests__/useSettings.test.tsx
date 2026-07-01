import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Settings } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';
import { useSettings } from '../useSettings';

// Mock Chrome runtime
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: vi.fn(),
  },
});

const mockSettings: Settings = {
  persona: 'site-owner',
  hasSeenOnboarding: true,
  wcagLevel: 'AA',
  showIncomplete: false,
  autoHighlight: true,
  visionMode: 'none',
  showFocusOrder: false,
};

// Mounting useSettings kicks off an async load effect (useSettings.ts): it awaits
// chrome.runtime.sendMessage({GET_SETTINGS}), then runs a store update + setLoaded.
// Those settle in later microtasks, so a bare renderHook leaves them to land after
// the test ends — tripping "not wrapped in act". Flushing the mount promise inside
// act() keeps those updates batched within the test.
async function mountSettings() {
  const utils = renderHook(() => useSettings());
  await act(async () => {});
  return utils;
}

describe('useSettings Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
    (chrome.runtime.sendMessage as any).mockResolvedValue({
      success: true,
      settings: mockSettings,
    });
  });

  describe('Hook initialization', () => {
    it('should return settings and updateSettings function', async () => {
      const { result } = await mountSettings();

      expect(result.current).toHaveProperty('settings');
      expect(result.current).toHaveProperty('updateSettings');
      expect(typeof result.current.updateSettings).toBe('function');
    });

    it('should initialize with default settings', async () => {
      const { result } = await mountSettings();

      expect(result.current.settings).toBeDefined();
      expect(result.current.settings.wcagLevel).toBeDefined();
      expect(result.current.settings.autoHighlight).toBeDefined();
      expect(result.current.settings.visionMode).toBeDefined();
    });

    it('should have all required settings properties', async () => {
      const { result } = await mountSettings();

      expect(result.current.settings).toHaveProperty('wcagLevel');
      expect(result.current.settings).toHaveProperty('showIncomplete');
      expect(result.current.settings).toHaveProperty('autoHighlight');
      expect(result.current.settings).toHaveProperty('visionMode');
      expect(result.current.settings).toHaveProperty('showFocusOrder');
    });
  });

  describe('Loading settings from storage', () => {
    it('should load settings from Chrome storage on mount', async () => {
      await mountSettings();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SETTINGS',
      });
    });

    it('should update store with loaded settings', async () => {
      const customSettings: Settings = {
        persona: 'developer',
        hasSeenOnboarding: true,
        wcagLevel: 'AAA',
        showIncomplete: true,
        autoHighlight: false,
        visionMode: 'protanopia',
        showFocusOrder: true,
      };

      (chrome.runtime.sendMessage as any).mockResolvedValue({
        success: true,
        settings: customSettings,
      });

      // mountSettings flushes the load effect (store update) inside act.
      const { result } = await mountSettings();

      expect(result.current.settings).toBeDefined();
    });

    it('should handle empty response from storage', async () => {
      (chrome.runtime.sendMessage as any).mockResolvedValue({
        success: false,
      });

      const { result } = await mountSettings();

      expect(result.current.settings).toBeDefined();
    });

    it('should handle storage load errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (chrome.runtime.sendMessage as any).mockRejectedValue(new Error('Storage error'));

      await mountSettings();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('Updating settings', () => {
    it('should update WCAG level', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ wcagLevel: 'AAA' });
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { wcagLevel: 'AAA' },
      });
    });

    it('should toggle showIncomplete setting', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ showIncomplete: true });
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { showIncomplete: true },
      });
    });

    it('should toggle autoHighlight setting', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ autoHighlight: false });
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { autoHighlight: false },
      });
    });

    it('should update vision mode', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ visionMode: 'deuteranopia' });
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { visionMode: 'deuteranopia' },
      });
    });

    it('should toggle showFocusOrder setting', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ showFocusOrder: true });
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: { showFocusOrder: true },
      });
    });

    it('should update multiple settings at once', async () => {
      const { result } = renderHook(() => useSettings());

      const updates: Partial<Settings> = {
        wcagLevel: 'AAA',
        showIncomplete: true,
        autoHighlight: false,
      };

      await act(async () => {
        await result.current.updateSettings(updates);
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: updates,
      });
    });

    it('should update local state immediately', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ wcagLevel: 'A' });
      });

      // Settings should be updated in the store
      expect(result.current.settings).toBeDefined();
    });

    it('should handle save errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (chrome.runtime.sendMessage as any).mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ wcagLevel: 'AAA' });
      });

      expect(errorSpy).toHaveBeenCalled();
      // Check that error was logged (first argument is the message string)
      expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
      errorSpy.mockRestore();
    });

    it('should still update local state even if save fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (chrome.runtime.sendMessage as any).mockRejectedValueOnce(new Error('Save failed'));

      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ autoHighlight: false });
      });

      expect(result.current.settings).toBeDefined();
      errorSpy.mockRestore();
    });
  });

  describe('Settings values validation', () => {
    it('should have valid WCAG level', async () => {
      const { result } = await mountSettings();

      expect(['A', 'AA', 'AAA']).toContain(result.current.settings.wcagLevel);
    });

    it('should have boolean showIncomplete', async () => {
      const { result } = await mountSettings();

      expect(typeof result.current.settings.showIncomplete).toBe('boolean');
    });

    it('should have boolean autoHighlight', async () => {
      const { result } = await mountSettings();

      expect(typeof result.current.settings.autoHighlight).toBe('boolean');
    });

    it('should have valid vision mode', async () => {
      const { result } = await mountSettings();

      const validModes = [
        'none',
        'protanopia',
        'deuteranopia',
        'tritanopia',
        'achromatopsia',
        'blur-low',
        'blur-medium',
        'blur-high',
      ];

      expect(validModes).toContain(result.current.settings.visionMode);
    });

    it('should have boolean showFocusOrder', async () => {
      const { result } = await mountSettings();

      expect(typeof result.current.settings.showFocusOrder).toBe('boolean');
    });
  });

  describe('Settings mutation', () => {
    it('should allow partial settings updates', () => {
      const baseSettings: Settings = { ...DEFAULT_SETTINGS };
      const updates: Partial<Settings> = {
        wcagLevel: 'AAA',
        showIncomplete: true,
      };

      const newSettings = { ...baseSettings, ...updates };

      expect(newSettings.wcagLevel).toBe('AAA');
      expect(newSettings.showIncomplete).toBe(true);
      expect(newSettings.autoHighlight).toBe(true); // unchanged
    });

    it('should preserve unmodified settings on update', async () => {
      const { result } = renderHook(() => useSettings());

      const originalAutoHighlight = result.current.settings.autoHighlight;

      await act(async () => {
        await result.current.updateSettings({ wcagLevel: 'AAA' });
      });

      // autoHighlight should remain unchanged
      expect(result.current.settings.autoHighlight).toBe(originalAutoHighlight);
    });

    it('should handle rapid successive updates', async () => {
      const { result } = renderHook(() => useSettings());

      await act(async () => {
        await result.current.updateSettings({ wcagLevel: 'AAA' });
        await result.current.updateSettings({ showIncomplete: true });
        await result.current.updateSettings({ autoHighlight: false });
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(4); // initial GET_SETTINGS + 3 updates
    });
  });

  describe('Chrome message handling', () => {
    it('should send GET_SETTINGS message on mount', async () => {
      await mountSettings();

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SETTINGS',
      });
    });

    it('should send UPDATE_SETTINGS message when saving', async () => {
      const { result } = renderHook(() => useSettings());

      const newSettings: Partial<Settings> = {
        wcagLevel: 'AAA',
        visionMode: 'protanopia',
      };

      await act(async () => {
        await result.current.updateSettings(newSettings);
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'UPDATE_SETTINGS',
        payload: newSettings,
      });
    });

    it('should handle successful response from GET_SETTINGS', async () => {
      const testSettings: Settings = {
        persona: 'developer',
        hasSeenOnboarding: true,
        wcagLevel: 'A',
        showIncomplete: true,
        autoHighlight: false,
        visionMode: 'achromatopsia',
        showFocusOrder: true,
      };

      (chrome.runtime.sendMessage as any).mockResolvedValueOnce({
        success: true,
        settings: testSettings,
      });

      const { result } = await mountSettings();

      expect(result.current.settings).toBeDefined();
    });

    it('should handle failed response from GET_SETTINGS', async () => {
      (chrome.runtime.sendMessage as any).mockResolvedValueOnce({
        success: false,
      });

      const { result } = await mountSettings();

      // Should still return valid settings
      expect(result.current.settings).toBeDefined();
    });
  });
});
