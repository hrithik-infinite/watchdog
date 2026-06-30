// Bundled into the on-demand IIFE content build (vite.content.config.ts) so the
// highlight styles ship inside the injected script's CSS instead of a
// declarative content_scripts.css.
import './styles.css';
import type { AuditType, Message, ScanResponse } from '@/shared/messaging';
import type { Severity, VisionMode } from '@/shared/types';
import { hideFocusOrder, toggleFocusOrder } from './focus-order';
import { clearHighlights, highlightElement, highlightMultiple } from './overlay';
import { scanPage } from './scanner';
import { applyVisionFilter, removeVisionFilter } from './vision-filters';

// Active vision-simulation mode, tracked so it can be re-applied after SPA
// route changes that wipe the filter (correctness-22).
let currentVisionMode: VisionMode = 'none';

// Listen for messages from the side panel and background
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: unknown) => void) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error: unknown) => {
        // error is unknown in a rejection handler; guard before reading .message
        // so non-Error throwables don't crash the handler (correctness-30 / err-12).
        console.error('WatchDog content script error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
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
        const { auditType } = message.payload as { auditType: AuditType };
        const result = await scanPage(auditType);

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

    case 'HIGHLIGHT_ALL': {
      // WAVE-style whole-page overlay: mark every issue's element at once.
      const { items } = message.payload as {
        items: Array<{ selector: string; severity: Severity }>;
      };
      highlightMultiple(items);
      return { success: true };
    }

    case 'CLEAR_HIGHLIGHTS': {
      clearHighlights();
      return { success: true };
    }

    case 'APPLY_VISION_FILTER': {
      const { mode } = message.payload as { mode: VisionMode };
      // Remember the active mode so an SPA navigation can restore it.
      currentVisionMode = mode;
      applyVisionFilter(mode);
      return { success: true };
    }

    case 'TOGGLE_FOCUS_ORDER': {
      const { show } = message.payload as { show: boolean };
      toggleFocusOrder(show);
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Re-apply the active vision filter after client-side (SPA) navigations.
// Frameworks that swap large DOM subtrees can drop the injected SVG <defs> and
// the inline <html> filter, silently disabling the simulation (correctness-22).
// We patch the history API + listen for popstate, then tear it all down on
// unload so nothing leaks if the script outlives the page.
function reapplyVisionFilter(): void {
  if (currentVisionMode !== 'none') {
    applyVisionFilter(currentVisionMode);
  }
}

// Defer to a microtask so the framework finishes its synchronous DOM swap
// before we re-inject the filter onto the freshly-rendered content.
function handleSpaNavigation(): void {
  queueMicrotask(reapplyVisionFilter);
}

let originalPushState: History['pushState'] | null = null;
let originalReplaceState: History['replaceState'] | null = null;

function installSpaHooks(): void {
  if (typeof history === 'undefined') return;

  originalPushState = history.pushState.bind(history);
  originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args: Parameters<History['pushState']>): void => {
    originalPushState?.(...args);
    handleSpaNavigation();
  };
  history.replaceState = (...args: Parameters<History['replaceState']>): void => {
    originalReplaceState?.(...args);
    handleSpaNavigation();
  };

  window.addEventListener('popstate', handleSpaNavigation);
}

function uninstallSpaHooks(): void {
  if (originalPushState) {
    history.pushState = originalPushState;
    originalPushState = null;
  }
  if (originalReplaceState) {
    history.replaceState = originalReplaceState;
    originalReplaceState = null;
  }
  window.removeEventListener('popstate', handleSpaNavigation);
}

// Clear highlights, vision filters, and focus order when page unloads
window.addEventListener('beforeunload', () => {
  clearHighlights();
  removeVisionFilter();
  hideFocusOrder();
  uninstallSpaHooks();
});

installSpaHooks();

// perf-rel-12: dropped the raw `console.log('WatchDog content script loaded')`
// that shipped on every on-demand injection; injection is already traced via
// the shared logger in shared/inject.ts.
