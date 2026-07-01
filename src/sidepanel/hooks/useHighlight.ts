import { useCallback } from 'react';
import logger from '@/shared/logger';
import type { Severity } from '@/shared/types';

// Highlighting is best-effort and fire-and-forget: the panel asks the background
// to forward the highlight to the armed tab's content script (injecting on
// demand). Failures (no armed tab, tab navigated) are logged, not surfaced — the
// page simply doesn't scroll/mark, which is a tolerable no-op for a hover cue.
export function useHighlight() {
  const highlightElement = useCallback(async (selector: string, severity: Severity) => {
    try {
      logger.debug('Highlighting element', { selector, severity });
      await chrome.runtime.sendMessage({
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
        logger.debug('Highlighting all elements', { count: items.length });
        await chrome.runtime.sendMessage({ type: 'HIGHLIGHT_ALL', payload: { items } });
      } catch (err) {
        logger.error('Failed to highlight all elements', { error: err });
      }
    },
    []
  );

  const clearHighlights = useCallback(async () => {
    try {
      logger.debug('Clearing highlights');
      await chrome.runtime.sendMessage({ type: 'CLEAR_HIGHLIGHTS' });
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
