import { useCallback } from 'react';
import { getCurrentTab } from '@/shared/messaging';
import type { Severity } from '@/shared/types';
import logger from '@/shared/logger';

export function useHighlight() {
  const highlightElement = useCallback(async (selector: string, severity: Severity) => {
    try {
      const tab = await getCurrentTab();
      if (!tab?.id) return;

      logger.debug('Highlighting element', { selector, severity });
      await chrome.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_ELEMENT',
        payload: { selector, severity },
      });
    } catch (err) {
      logger.error('Failed to highlight element', { selector, error: err });
    }
  }, []);

  const clearHighlights = useCallback(async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab?.id) return;

      logger.debug('Clearing highlights');
      await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTS' });
    } catch (err) {
      logger.error('Failed to clear highlights', { error: err });
    }
  }, []);

  return {
    highlightElement,
    clearHighlights,
  };
}
