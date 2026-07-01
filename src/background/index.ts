import logger from '@/shared/logger';
import type { Message } from '@/shared/messaging';
import type { ScanResult } from '@/shared/types';
import { clearBadge, updateBadge } from './badge';
import { getSettings, saveSettings } from './storage';

// No install-time content-script injection. Without a declarative `<all_urls>`
// content script (dropped in secpriv-6) the extension holds no broad host
// access, so a background-initiated injection into open tabs would fail anyway.
// The scanner is injected on demand into the active tab when the user scans or
// toggles a page overlay (see shared/inject.ts); host access for that injection
// is requested at runtime via chrome.permissions (see shared/permissions.ts) —
// a side panel opened from the action icon does not receive an activeTab grant.

// Enable side panel on extension click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Listen for messages from content scripts and popup
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
      console.error('Message handler error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

export async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'SCAN_RESULT': {
      const result = message.payload as ScanResult;
      const tabId = sender.tab?.id;
      if (tabId) {
        await updateBadge(tabId, result.summary.total);
      }
      return { success: true };
    }

    case 'SET_BADGE': {
      // Explicit tab + total from the side panel — used so a multi-scan badge
      // shows the combined total on the scanned tab, not the last audit's count
      // (correctness-5).
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

// Clear badge when tab is closed or navigates
chrome.tabs.onRemoved.addListener((tabId) => {
  clearBadge(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    clearBadge(tabId);
  }
});

logger.info('Background service worker initialized');
