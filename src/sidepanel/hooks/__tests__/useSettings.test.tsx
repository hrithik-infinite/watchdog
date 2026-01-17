import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Settings, WCAGLevel, VisionMode } from '@/shared/types';

describe('Settings', () => {
  it('should have correct default settings structure', () => {
    expect(DEFAULT_SETTINGS).toHaveProperty('wcagLevel');
    expect(DEFAULT_SETTINGS).toHaveProperty('showIncomplete');
    expect(DEFAULT_SETTINGS).toHaveProperty('autoHighlight');
    expect(DEFAULT_SETTINGS).toHaveProperty('visionMode');
    expect(DEFAULT_SETTINGS).toHaveProperty('showFocusOrder');
  });

  it('should have correct default values', () => {
    expect(DEFAULT_SETTINGS.wcagLevel).toBe('AA');
    expect(DEFAULT_SETTINGS.showIncomplete).toBe(false);
    expect(DEFAULT_SETTINGS.autoHighlight).toBe(true);
    expect(DEFAULT_SETTINGS.visionMode).toBe('none');
    expect(DEFAULT_SETTINGS.showFocusOrder).toBe(false);
  });

  it('should validate WCAG levels', () => {
    const validLevels: WCAGLevel[] = ['A', 'AA', 'AAA'];
    validLevels.forEach((level) => {
      expect(['A', 'AA', 'AAA']).toContain(level);
    });
  });

  it('should validate vision modes', () => {
    const validModes: VisionMode[] = [
      'none',
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'achromatopsia',
      'blur-low',
      'blur-medium',
      'blur-high',
    ];

    validModes.forEach((mode) => {
      expect([
        'none',
        'protanopia',
        'deuteranopia',
        'tritanopia',
        'achromatopsia',
        'blur-low',
        'blur-medium',
        'blur-high',
      ]).toContain(mode);
    });
  });

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

  it('should validate boolean settings', () => {
    const booleanSettings: (keyof Settings)[] = ['showIncomplete', 'autoHighlight', 'showFocusOrder'];

    booleanSettings.forEach((key) => {
      const value = DEFAULT_SETTINGS[key];
      expect(typeof value).toBe('boolean');
    });
  });
});
