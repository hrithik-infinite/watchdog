import { ensureContentScript } from '@/shared/inject';
import logger from '@/shared/logger';
import type { AuditType, Message, ScanResponse } from '@/shared/messaging';
import type { ScanResult } from '@/shared/types';
import { armTab, disarmTab, getArmedTab } from './armed-tab';
import { clearBadge, updateBadge } from './badge';
import { NO_ARMED_TAB_MESSAGE, runScan } from './scan-orchestrator';
import { getSettings, saveSettings } from './storage';

// The background service worker is the extension's only page-toucher. A side panel
// never receives Chrome's activeTab grant, but the toolbar-icon click that opens
// the panel DOES grant activeTab to the extension for that tab — and the worker
// that handles chrome.action.onClicked can use it. So the panel delegates every
// page operation (scan, overlays, highlights) to the worker via runtime messages;
// the worker injects and drives the content script under that grant. There is no
// declarative content script and no host permission — nothing runs on a page until
// the user clicks the icon on it. See shared/inject.ts and background/armed-tab.ts.

// Toolbar-icon click: open the panel and arm the clicked tab. sidePanel.open()
// requires a live user gesture, so it must run BEFORE any await — a preceding
// async hop would consume the activation and Chrome would reject the open.
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId != null) {
    chrome.sidePanel
      .open({ windowId: tab.windowId })
      .catch((error) => logger.error('Failed to open side panel', { error }));
  }
  void armClickedTab(tab);
});

// Record the clicked tab as armed. The click granted activeTab, so tab.url is
// populated; fall back to chrome.tabs.get (also covered by the grant) if not.
async function armClickedTab(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id == null) return;
  let url = tab.url;
  if (!url) {
    try {
      url = (await chrome.tabs.get(tab.id)).url;
    } catch (error) {
      logger.error('Failed to resolve armed tab url', { error });
    }
  }
  await armTab({ id: tab.id, url: url ?? '' });
}

// The controller for the in-flight scan; CANCEL_SCAN aborts it.
let activeScanController: AbortController | null = null;

// Listen for messages from the side panel and content scripts.
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  // Only honor messages from this extension's own surfaces. There is no
  // externally_connectable, so this is defense-in-depth: it keeps these handlers
  // first-party even if a future manifest change exposes the runtime channel.
  if (sender.id !== chrome.runtime.id) {
    return false;
  }

  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error: unknown) => {
      // error is unknown in a rejection handler; guard before reading .message
      // so non-Error throwables don't crash the handler (correctness-30 / err-12).
      logger.error('Message handler error', { error });
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Forward a page-directed message (overlay / highlight) to the armed tab's content
// script, injecting it on demand first. Returns a friendly failure (not a throw)
// when no tab is armed so the panel can surface it inline.
async function forwardToArmedTab(message: Message): Promise<unknown> {
  const armed = await getArmedTab();
  if (!armed) {
    return { success: false, error: NO_ARMED_TAB_MESSAGE };
  }
  await ensureContentScript(armed.id);
  return chrome.tabs.sendMessage(armed.id, message);
}

async function handleScanRequest(auditTypes: AuditType[]): Promise<ScanResponse> {
  // A new scan supersedes any in-flight one (they should not overlap, but be safe).
  activeScanController?.abort();
  const controller = new AbortController();
  activeScanController = controller;
  try {
    const { result, partialError } = await runScan(auditTypes, controller.signal);
    // On a partial multi-scan failure success stays true: the panel shows the
    // results it did get, plus `error` as a non-blocking banner.
    return { success: true, result, error: partialError };
  } catch (err) {
    if (controller.signal.aborted) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err instanceof Error ? err.message : 'Scan failed' };
  } finally {
    if (activeScanController === controller) activeScanController = null;
  }
}

export async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'SCAN_REQUEST':
      return handleScanRequest(message.payload.auditTypes);

    case 'CANCEL_SCAN': {
      activeScanController?.abort();
      return { success: true };
    }

    case 'GET_ARMED_TAB': {
      const tab = await getArmedTab();
      return { success: true, tab };
    }

    // Page-directed overlays/highlights: forward to the armed tab's content script.
    case 'APPLY_VISION_FILTER':
    case 'TOGGLE_FOCUS_ORDER':
    case 'HIGHLIGHT_ELEMENT':
    case 'HIGHLIGHT_ALL':
    case 'CLEAR_HIGHLIGHTS':
      return forwardToArmedTab(message);

    case 'SCAN_RESULT': {
      // Fired fire-and-forget by the content script after each audit; sets a
      // per-audit badge on the scanned tab. The orchestrator sets the final
      // (combined) badge when the run completes.
      const result = message.payload as ScanResult;
      const tabId = sender.tab?.id;
      if (tabId) {
        await updateBadge(tabId, result.summary.total);
      }
      return { success: true };
    }

    case 'SET_BADGE': {
      const { tabId, count } = message.payload as { tabId: number; count: number };
      await updateBadge(tabId, count);
      return { success: true };
    }

    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { success: true, settings };
    }

    case 'UPDATE_SETTINGS': {
      await saveSettings(message.payload);
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Clear the badge and disarm the tab when it closes or navigates. A full
// navigation both wipes the injected content script and (cross-origin) revokes the
// activeTab grant, so the tab must be re-armed by another toolbar click.
chrome.tabs.onRemoved.addListener((tabId) => {
  clearBadge(tabId);
  void disarmTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    clearBadge(tabId);
    void disarmTab(tabId);
  }
});

logger.info('Background service worker initialized');
