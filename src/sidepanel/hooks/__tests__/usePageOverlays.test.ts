import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import { useScanStore } from '@/sidepanel/store';
import { usePageOverlays } from '../usePageOverlays';

// The panel no longer injects or messages the page itself. Both the persist
// (UPDATE_SETTINGS) and the apply (APPLY_VISION_FILTER / TOGGLE_FOCUS_ORDER) go to
// the background via chrome.runtime.sendMessage; the background forwards the apply
// to the armed tab's content script. The mock answers success by default and lets
// individual tests fail the apply to exercise rollback.
const runtimeSendMessage = vi.fn(() => Promise.resolve({ success: true }));
vi.stubGlobal('chrome', {
  runtime: { sendMessage: runtimeSendMessage },
});

describe('usePageOverlays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtimeSendMessage.mockImplementation(() => Promise.resolve({ success: true }));
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('setVisionMode persists the preference and applies it via the background', async () => {
    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setVisionMode('deuteranopia');
    });

    expect(useScanStore.getState().settings.visionMode).toBe('deuteranopia');
    expect(runtimeSendMessage).toHaveBeenCalledWith({
      type: 'UPDATE_SETTINGS',
      payload: { visionMode: 'deuteranopia' },
    });
    expect(runtimeSendMessage).toHaveBeenCalledWith({
      type: 'APPLY_VISION_FILTER',
      payload: { mode: 'deuteranopia' },
    });
    expect(result.current.overlayError).toBeNull();
  });

  it('setFocusOrder persists and toggles focus order via the background', async () => {
    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setFocusOrder(true);
    });

    expect(useScanStore.getState().settings.showFocusOrder).toBe(true);
    expect(runtimeSendMessage).toHaveBeenCalledWith({
      type: 'TOGGLE_FOCUS_ORDER',
      payload: { show: true },
    });
  });

  it('rolls back the optimistic toggle and surfaces an error when the background reports failure', async () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, visionMode: 'none' } });
    // The background answers the apply with a failure (e.g. no armed tab).
    runtimeSendMessage.mockImplementation((msg: { type: string }) =>
      msg.type === 'APPLY_VISION_FILTER'
        ? Promise.resolve({
            success: false,
            error: 'Click the WatchDog toolbar icon on the page you want to scan, then scan again.',
          })
        : Promise.resolve({ success: true })
    );

    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setVisionMode('protanopia');
    });

    // The optimistic flip is reverted to the prior value (no stuck-on switch)...
    expect(useScanStore.getState().settings.visionMode).toBe('none');
    // ...and the background's actionable message is surfaced.
    expect(result.current.overlayError).toBe(
      'Click the WatchDog toolbar icon on the page you want to scan, then scan again.'
    );
  });

  it('rolls back and surfaces an error when the message channel rejects', async () => {
    useScanStore.setState({ settings: { ...DEFAULT_SETTINGS, showFocusOrder: false } });
    runtimeSendMessage.mockImplementation((msg: { type: string }) =>
      msg.type === 'TOGGLE_FOCUS_ORDER'
        ? Promise.reject(new Error('disconnected'))
        : Promise.resolve({ success: true })
    );

    const { result } = renderHook(() => usePageOverlays());

    await act(async () => {
      await result.current.setFocusOrder(true);
    });

    expect(useScanStore.getState().settings.showFocusOrder).toBe(false);
    expect(result.current.overlayError).toBe('disconnected');
  });
});
