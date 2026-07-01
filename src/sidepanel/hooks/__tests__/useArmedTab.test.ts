import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useArmedTab } from '../useArmedTab';

const sendMessage = vi.fn();
vi.stubGlobal('chrome', { runtime: { sendMessage } });

describe('useArmedTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMessage.mockResolvedValue({ success: true, tab: null });
  });

  it('requests the armed tab on mount and exposes its hostname', async () => {
    sendMessage.mockResolvedValue({
      success: true,
      tab: { id: 1, url: 'https://example.com/some/page?q=1' },
    });

    const { result } = renderHook(() => useArmedTab());

    expect(sendMessage).toHaveBeenCalledWith({ type: 'GET_ARMED_TAB' });
    await waitFor(() => expect(result.current.hostname).toBe('example.com'));
  });

  it('reports no hostname when no tab is armed', async () => {
    sendMessage.mockResolvedValue({ success: true, tab: null });
    const { result } = renderHook(() => useArmedTab());

    // Give the resolved promise a tick; hostname stays null.
    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(result.current.hostname).toBeNull();
  });

  it('falls back to the raw url string when it cannot be parsed', async () => {
    sendMessage.mockResolvedValue({ success: true, tab: { id: 1, url: 'not-a-valid-url' } });
    const { result } = renderHook(() => useArmedTab());

    await waitFor(() => expect(result.current.hostname).toBe('not-a-valid-url'));
  });

  it('re-resolves the armed tab when the panel becomes visible again', async () => {
    const { result } = renderHook(() => useArmedTab());
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    sendMessage.mockResolvedValue({ success: true, tab: { id: 2, url: 'https://re-armed.test' } });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(result.current.hostname).toBe('re-armed.test'));
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('swallows a rejected lookup without throwing', async () => {
    sendMessage.mockRejectedValue(new Error('no background'));
    const { result } = renderHook(() => useArmedTab());

    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(result.current.hostname).toBeNull();
  });
});
