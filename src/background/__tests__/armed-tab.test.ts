import { beforeEach, describe, expect, it, vi } from 'vitest';

const ARMED_TAB_KEY = 'watchdog_armed_tab';

const sessionStore = {
  get: vi.fn(() => Promise.resolve({} as Record<string, unknown>)),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
};
vi.stubGlobal('chrome', { storage: { session: sessionStore } });

describe('armed-tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fresh module each test so the in-memory `armedTab`/`hydrated` state resets.
    vi.resetModules();
    sessionStore.get.mockResolvedValue({});
  });

  it('persists the armed tab and returns it without re-reading storage', async () => {
    const { armTab, getArmedTab } = await import('../armed-tab');

    await armTab({ id: 5, url: 'https://example.com' });

    expect(sessionStore.set).toHaveBeenCalledWith({
      [ARMED_TAB_KEY]: { id: 5, url: 'https://example.com' },
    });
    expect(await getArmedTab()).toEqual({ id: 5, url: 'https://example.com' });
    // Already in memory → no session read needed.
    expect(sessionStore.get).not.toHaveBeenCalled();
  });

  it('hydrates the armed tab from session storage after a worker restart', async () => {
    sessionStore.get.mockResolvedValue({ [ARMED_TAB_KEY]: { id: 9, url: 'https://x.test' } });
    const { getArmedTab } = await import('../armed-tab');

    expect(await getArmedTab()).toEqual({ id: 9, url: 'https://x.test' });
    expect(sessionStore.get).toHaveBeenCalledWith(ARMED_TAB_KEY);
  });

  it('returns null when nothing is armed', async () => {
    const { getArmedTab } = await import('../armed-tab');
    expect(await getArmedTab()).toBeNull();
  });

  it('disarms the matching tab and clears storage', async () => {
    const { armTab, getArmedTab, disarmTab } = await import('../armed-tab');
    await armTab({ id: 5, url: 'https://x' });

    await disarmTab(5);

    expect(sessionStore.remove).toHaveBeenCalledWith(ARMED_TAB_KEY);
    expect(await getArmedTab()).toBeNull();
  });

  it('ignores a disarm for a different tab', async () => {
    const { armTab, getArmedTab, disarmTab } = await import('../armed-tab');
    await armTab({ id: 5, url: 'https://x' });

    await disarmTab(99);

    expect(sessionStore.remove).not.toHaveBeenCalled();
    expect(await getArmedTab()).toEqual({ id: 5, url: 'https://x' });
  });
});
