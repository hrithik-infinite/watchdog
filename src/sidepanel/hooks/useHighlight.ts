import { useCallback } from 'react';
import { getCurrentTab } from '@/shared/messaging';
import type { Severity } from '@/shared/types';

export function useHighlight() {
  const highlightElement = useCallback(async (selector: string, severity: Severity) => {
    try {
      const tab = await getCurrentTab();
      if (!tab?.id) return;

      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector, severity },
      });
    } catch (err) {
      console.error('Failed to highlight element:', err);
    }
  }, []);

  const clearHighlights = useCallback(async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab?.id) return;

      await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' });
    } catch (err) {
      console.error('Failed to clear highlights:', err);
    }
  }, []);

  return {
    highlightElement,
    clearHighlights,
  };
}
