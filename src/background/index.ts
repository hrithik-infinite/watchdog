import { updateBadge, clearBadge } from './badge';
import { getSettings, saveSettings } from './storage';
import type { Message } from '@/shared/messaging';
import type { ScanResult } from '@/shared/types';

// Inject content scripts into existing tabs on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Get content script files from the manifest (handles build-time transformations)
    const manifest = chrome.runtime.getManifest();
    const contentScriptConfig = manifest.content_scripts?.[0];
    if (!contentScriptConfig) return;

    const jsFiles = contentScriptConfig.js || [];
    const cssFiles = contentScriptConfig.css || [];

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      // Skip chrome://, edge://, about:, and extension pages
      if (
        tab.id &&
        tab.url &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        !tab.url.startsWith('edge://') &&
        !tab.url.startsWith('about:') &&
        !tab.url.startsWith('moz-extension://')
      ) {
        try {
          if (jsFiles.length > 0) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: jsFiles,
            });
          }
          if (cssFiles.length > 0) {
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: cssFiles,
            });
          }
        } catch {
          // Tab may not allow script injection (e.g., Chrome Web Store)
        }
      }
    }
  }
});

// Enable side panel on extension click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'SCAN_RESULT': {
      const result = message.payload as ScanResult;
      const tabId = sender.tab?.id;
      if (tabId) {
        await updateBadge(tabId, result.summary.total);
      }
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
