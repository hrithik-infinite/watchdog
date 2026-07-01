import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Persona, Severity } from '@/shared/types';
import { useScanStore } from '../../store';
import { AUDIT_ONE_LINERS, SEVERITY_PLAIN, useIsSiteOwner, usePersona } from '../persona';

/**
 * The hooks are thin selectors over the zustand scan store. We drive them by
 * mutating `settings.persona` directly and assert the selected slice, then
 * restore the store so tests stay independent.
 */
function setPersona(persona: Persona): void {
  useScanStore.setState((state) => ({
    settings: { ...state.settings, persona },
  }));
}

const initialSettings = useScanStore.getState().settings;

afterEach(() => {
  // This file's afterEach runs before testing-library's auto-cleanup (Vitest runs
  // afterEach LIFO), so the rendered selector hooks are still mounted here. Resetting
  // the store flips their selected persona, re-rendering them — wrap it in act so that
  // update doesn't land outside act and trip a "not wrapped in act" warning.
  act(() => {
    useScanStore.setState({ settings: initialSettings });
  });
});

describe('usePersona', () => {
  it('returns the default persona (site-owner) out of the box', () => {
    const { result } = renderHook(() => usePersona());
    expect(result.current).toBe('site-owner');
  });

  it('reflects the developer persona once set', () => {
    setPersona('developer');
    const { result } = renderHook(() => usePersona());
    expect(result.current).toBe('developer');
  });

  it('reflects the site-owner persona once set', () => {
    setPersona('site-owner');
    const { result } = renderHook(() => usePersona());
    expect(result.current).toBe('site-owner');
  });
});

describe('useIsSiteOwner', () => {
  it('is true when the persona is site-owner', () => {
    setPersona('site-owner');
    const { result } = renderHook(() => useIsSiteOwner());
    expect(result.current).toBe(true);
  });

  it('is false when the persona is developer', () => {
    setPersona('developer');
    const { result } = renderHook(() => useIsSiteOwner());
    expect(result.current).toBe(false);
  });
});

describe('SEVERITY_PLAIN', () => {
  const severities: Severity[] = ['critical', 'serious', 'moderate', 'minor'];

  it('provides a non-empty plain-language subtitle for every severity', () => {
    for (const severity of severities) {
      expect(SEVERITY_PLAIN[severity]).toBeTruthy();
      expect(typeof SEVERITY_PLAIN[severity]).toBe('string');
    }
  });

  it('covers exactly the four canonical severities', () => {
    expect(Object.keys(SEVERITY_PLAIN).sort()).toEqual([...severities].sort());
  });

  it('maps each severity to its expected copy', () => {
    expect(SEVERITY_PLAIN.critical).toBe('Blocks people from using the page');
    expect(SEVERITY_PLAIN.serious).toBe('Big problems for many visitors');
    expect(SEVERITY_PLAIN.moderate).toBe('Noticeable issues worth fixing');
    expect(SEVERITY_PLAIN.minor).toBe('Small polish');
  });
});

describe('AUDIT_ONE_LINERS', () => {
  it('provides a non-empty benefit-led one-liner for each known audit', () => {
    const audits = ['accessibility', 'performance', 'seo', 'security', 'best-practices', 'pwa'];
    for (const audit of audits) {
      expect(AUDIT_ONE_LINERS[audit]).toBeTruthy();
      expect(typeof AUDIT_ONE_LINERS[audit]).toBe('string');
    }
  });

  it('maps each audit id to its expected copy', () => {
    expect(AUDIT_ONE_LINERS.accessibility).toBe('Can everyone use your site?');
    expect(AUDIT_ONE_LINERS.performance).toBe('Does your site load fast?');
    expect(AUDIT_ONE_LINERS.seo).toBe('Will Google find and rank your page?');
    expect(AUDIT_ONE_LINERS.security).toBe('Is your site safe for visitors?');
    expect(AUDIT_ONE_LINERS['best-practices']).toBe('Is your site built to modern standards?');
    expect(AUDIT_ONE_LINERS.pwa).toBe('Can people install your site like an app?');
  });

  it('returns undefined for an unknown audit id', () => {
    expect(AUDIT_ONE_LINERS.unknown).toBeUndefined();
  });
});
