import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useScanStore } from '@/sidepanel/store';
import { getTargetTab } from '../target-tab';

vi.mock('@/shared/messaging', () => ({ getCurrentTab: vi.fn() }));

const tabsGet = vi.fn();
vi.stubGlobal('chrome', { tabs: { get: tabsGet } });

const { getCurrentTab } = await import('@/shared/messaging');

describe('getTargetTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: nothing scanned → fall back to the active tab.
    useScanStore.setState({ scannedTabId: null });
  });

  it('resolves the scanned tab (with its url) when one was recorded', async () => {
    useScanStore.setState({ scannedTabId: 7 });
    tabsGet.mockResolvedValue({ id: 7, url: 'https://scanned.example/page' });

    const tab = await getTargetTab();

    expect(tabsGet).toHaveBeenCalledWith(7);
    expect(tab?.url).toBe('https://scanned.example/page');
    expect(getCurrentTab).not.toHaveBeenCalled();
  });

  it('falls back to the active tab when the scanned tab is gone', async () => {
    useScanStore.setState({ scannedTabId: 7 });
    tabsGet.mockRejectedValue(new Error('No tab with id: 7'));
    (getCurrentTab as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
      url: 'https://active.example/',
    });

    const tab = await getTargetTab();

    expect(tab?.id).toBe(3);
  });

  it('uses the active tab when nothing has been scanned', async () => {
    (getCurrentTab as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
      url: 'https://active.example/',
    });

    const tab = await getTargetTab();

    expect(tabsGet).not.toHaveBeenCalled();
    expect(tab?.id).toBe(3);
  });
});
