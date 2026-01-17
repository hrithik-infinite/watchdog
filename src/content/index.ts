import { scanPage } from './scanner';
import { highlightElement, clearHighlights } from './overlay';
import { applyVisionFilter, removeVisionFilter } from './vision-filters';
import type { Message, ScanResponse } from '@/shared/messaging';
import type { Severity, VisionMode } from '@/shared/types';

// Listen for messages from the side panel and background
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: unknown) => void) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('WatchDog content script error:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
);

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'PING': {
      return { success: true, loaded: true };
    }

    case 'SCAN_PAGE': {
      try {
        const result = await scanPage();

        // Notify background to update badge
        chrome.runtime.sendMessage({
          type: 'SCAN_RESULT',
          payload: result,
        });

        const response: ScanResponse = {
          success: true,
          result,
        };
        return response;
      } catch (error) {
        const response: ScanResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Scan failed',
        };
        return response;
      }
    }

    case 'HIGHLIGHT_ELEMENT': {
      const { selector, severity } = message.payload as { selector: string; severity: Severity };
      highlightElement(selector, severity);
      return { success: true };
    }

    case 'CLEAR_HIGHLIGHTS': {
      clearHighlights();
      return { success: true };
    }

    case 'APPLY_VISION_FILTER': {
      const { mode } = message.payload as { mode: VisionMode };
      applyVisionFilter(mode);
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Clear highlights and vision filters when page unloads
window.addEventListener('beforeunload', () => {
  clearHighlights();
  removeVisionFilter();
});

console.log('WatchDog content script loaded');
