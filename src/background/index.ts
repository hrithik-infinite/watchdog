import { updateBadge, clearBadge } from './badge';
import { getSettings, saveSettings } from './storage';
import type { Message } from '@/shared/messaging';
import type { ScanResult } from '@/shared/types';

// No install-time content-script injection. Without a declarative `<all_urls>`
// content script (dropped in secpriv-6) the extension holds no broad host
// access, so a background-initiated injection into open tabs would fail anyway.
// The scanner is injected on demand into the active tab when the user scans or
// toggles a page overlay (see shared/inject.ts), covered by `activeTab`.

// Enable side panel on extension click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
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

    case 'OPEN_SIDEPANEL': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
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

console.log('WatchDog background service worker initialized');
