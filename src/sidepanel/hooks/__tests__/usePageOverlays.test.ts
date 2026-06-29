import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageOverlays } from '../usePageOverlays';
import { useScanStore } from '@/sidepanel/store';
import { DEFAULT_SETTINGS } from '@/shared/constants';

vi.mock('@/shared/messaging', () => ({ getCurrentTab: vi.fn() }));
vi.mock('@/shared/inject', () => ({ ensureContentScript: vi.fn().mockResolvedValue(undefined) }));

const tabsSendMessage = vi.fn().mockResolvedValue(undefined);
const runtimeSendMessage = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('chrome', {
  tabs: { sendMessage: tabsSendMessage },
  runtime: { sendMessage: runtimeSendMessage },
});

const { getCurrentTab } = await import('@/shared/messaging');
const { ensureContentScript } = await import('@/shared/inject');

describe('usePageOverlays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
    (getCurrentTab as any).mockResolvedValue({ id: 5, url: 'https://example.com' });
  });

  it('setVisionMode persists the preference and applies it to the active tab', async () => {
    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setVisionMode('deuteranopia');
    });

    expect(useScanStore.getState().settings.visionMode).toBe('deuteranopia');
    expect(runtimeSendMessage).toHaveBeenCalledWith({
      type: 'UPDATE_SETTINGS',
      payload: { visionMode: 'deuteranopia' },
    });
    expect(ensureContentScript).toHaveBeenCalledWith(5);
    expect(tabsSendMessage).toHaveBeenCalledWith(5, {
      type: 'APPLY_VISION_FILTER',
      payload: { mode: 'deuteranopia' },
    });
  });

  it('setFocusOrder persists and toggles focus order on the page', async () => {
    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setFocusOrder(true);
    });

    expect(useScanStore.getState().settings.showFocusOrder).toBe(true);
    expect(tabsSendMessage).toHaveBeenCalledWith(5, {
      type: 'TOGGLE_FOCUS_ORDER',
      payload: { show: true },
    });
  });

  it('still persists when there is no active tab to message', async () => {
    (getCurrentTab as any).mockResolvedValue(undefined);
    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setVisionMode('protanopia');
    });

    expect(useScanStore.getState().settings.visionMode).toBe('protanopia');
    expect(tabsSendMessage).not.toHaveBeenCalled();
  });
});
