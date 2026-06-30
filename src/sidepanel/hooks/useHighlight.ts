import { useCallback } from 'react';
import logger from '@/shared/logger';
import type { Severity } from '@/shared/types';
import { getTargetTabId } from '@/sidepanel/lib/target-tab';

export function useHighlight() {
  const highlightElement = useCallback(async (selector: string, severity: Severity) => {
    try {
      const tabId = await getTargetTabId();
      if (tabId == null) return;

      logger.debug('Highlighting element', { selector, severity });
      await chrome.tabs.sendMessage(tabId, {
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
        const tabId = await getTargetTabId();
        if (tabId == null) return;

        logger.debug('Highlighting all elements', { count: items.length });
        await chrome.tabs.sendMessage(tabId, {
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
      const tabId = await getTargetTabId();
      if (tabId == null) return;

      logger.debug('Clearing highlights');
      await chrome.tabs.sendMessage(tabId, { type: 'CLEAR_HIGHLIGHTS' });
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
