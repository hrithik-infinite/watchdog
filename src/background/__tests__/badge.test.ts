import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateBadge, clearBadge } from '../badge';

const setBadgeText = vi.fn().mockResolvedValue(undefined);
const setBadgeBackgroundColor = vi.fn().mockResolvedValue(undefined);
const setBadgeTextColor = vi.fn().mockResolvedValue(undefined);

vi.stubGlobal('chrome', {
  action: { setBadgeText, setBadgeBackgroundColor, setBadgeTextColor },
});

describe('background/badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBadgeText.mockResolvedValue(undefined);
    setBadgeBackgroundColor.mockResolvedValue(undefined);
    setBadgeTextColor.mockResolvedValue(undefined);
  });

  describe('updateBadge', () => {
    it('shows an empty badge and the green color for zero issues', async () => {
      await updateBadge(1, 0);
      expect(setBadgeText).toHaveBeenCalledWith({ tabId: 1, text: '' });
      expect(setBadgeBackgroundColor).toHaveBeenCalledWith({ tabId: 1, color: '#10B981' });
    });

    it('maps issue counts to severity colors', async () => {
      await updateBadge(1, 3); // <=5 -> low/blue
      expect(setBadgeBackgroundColor).toHaveBeenCalledWith({ tabId: 1, color: '#3B82F6' });

      await updateBadge(1, 10); // <=15 -> medium/orange
      expect(setBadgeBackgroundColor).toHaveBeenCalledWith({ tabId: 1, color: '#F59E0B' });

      await updateBadge(1, 40); // >15 -> high/red
      expect(setBadgeBackgroundColor).toHaveBeenCalledWith({ tabId: 1, color: '#DC2626' });
    });

    it('caps the badge text at 99+', async () => {
      await updateBadge(1, 150);
      expect(setBadgeText).toHaveBeenCalledWith({ tabId: 1, text: '99+' });
    });

    it('uses white badge text', async () => {
      await updateBadge(2, 7);
      expect(setBadgeTextColor).toHaveBeenCalledWith({ tabId: 2, color: '#FFFFFF' });
    });

    it('swallows chrome errors (tab may be gone)', async () => {
      setBadgeText.mockRejectedValueOnce(new Error('No tab with id'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(updateBadge(99, 5)).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('clearBadge', () => {
    it('clears the badge text for the tab', async () => {
      await clearBadge(5);
      expect(setBadgeText).toHaveBeenCalledWith({ tabId: 5, text: '' });
    });

    // Documents current behavior: clearBadge resets text only, not the background
    // color (correctness-31 in the Phase-3 backlog will change this).
    it('does not reset the background color', async () => {
      await clearBadge(5);
      expect(setBadgeBackgroundColor).not.toHaveBeenCalled();
    });

    it('ignores errors when the tab is already closed', async () => {
      setBadgeText.mockRejectedValueOnce(new Error('No tab'));
      await expect(clearBadge(123)).resolves.toBeUndefined();
    });
  });
});
