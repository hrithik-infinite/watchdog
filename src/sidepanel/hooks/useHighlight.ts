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

  // WAVE-style whole-page overlay: highlight every issue's element at once.
  const highlightAll = useCallback(
    async (items: Array<{ selector: string; severity: Severity }>) => {
      try {
        const tab = await getCurrentTab();
        if (!tab?.id) return;

        logger.debug('Highlighting all elements', { count: items.length });
        await chrome.tabs.sendMessage(tab.id, {
          type: 'HIGHLIGHT_ALL',
          payload: { items },
        });
      } catch (err) {
        logger.error('Failed to highlight all elements', { error: err });
      }
    },
    []
  );

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
    highlightAll,
    clearHighlights,
  };
}
