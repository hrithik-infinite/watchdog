import type { ScanResult, Settings, Severity, VisionMode } from './types';

export type AuditType =
  | 'accessibility'
  | 'performance'
  | 'seo'
  | 'security'
  | 'best-practices'
  | 'pwa';

// Message types for communication between extension parts
export type MessageType =
  | 'PING'
  | 'SCAN_PAGE'
  | 'SCAN_RESULT'
  | 'SCAN_REQUEST'
  | 'SCAN_PROGRESS'
  | 'CANCEL_SCAN'
  | 'GET_ARMED_TAB'
  | 'HIGHLIGHT_ELEMENT'
  | 'HIGHLIGHT_ALL'
  | 'CLEAR_HIGHLIGHTS'
  | 'APPLY_VISION_FILTER'
  | 'TOGGLE_FOCUS_ORDER'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'SET_BADGE';

// Message payloads
export interface PingMessage {
  type: 'PING';
}

export interface ScanPageMessage {
  type: 'SCAN_PAGE';
  payload: {
    auditType: AuditType;
  };
}

export interface ScanResultMessage {
  type: 'SCAN_RESULT';
  payload: ScanResult;
}

// Panel → background. Asks the background (which holds the activeTab grant from
// the toolbar click) to run one or more audits against the armed tab. The
// background owns the whole page-touch sequence — guards, on-demand injection,
// the per-audit loop — because a side panel never receives activeTab and so
// cannot executeScript itself.
export interface ScanRequestMessage {
  type: 'SCAN_REQUEST';
  payload: {
    auditTypes: AuditType[];
  };
}

// Background → panel. Streamed once per audit during a multi-audit run so the
// panel's progress UI can advance without owning the loop.
export interface ScanProgressMessage {
  type: 'SCAN_PROGRESS';
  payload: {
    index: number;
    total: number;
    auditType: AuditType;
  };
}

// Panel → background. Aborts the in-flight SCAN_REQUEST (user hit Cancel).
export interface CancelScanMessage {
  type: 'CANCEL_SCAN';
}

// Panel → background. Resolves the armed tab (the tab whose toolbar icon was
// clicked) so the panel can show which page it will scan and hint when the user
// has since switched tabs.
export interface GetArmedTabMessage {
  type: 'GET_ARMED_TAB';
}

export interface HighlightElementMessage {
  type: 'HIGHLIGHT_ELEMENT';
  payload: {
    selector: string;
    severity: Severity;
  };
}

export interface HighlightAllMessage {
  type: 'HIGHLIGHT_ALL';
  payload: {
    items: Array<{ selector: string; severity: Severity }>;
  };
}

export interface ClearHighlightsMessage {
  type: 'CLEAR_HIGHLIGHTS';
}

export interface ApplyVisionFilterMessage {
  type: 'APPLY_VISION_FILTER';
  payload: {
    mode: VisionMode;
  };
}

export interface ToggleFocusOrderMessage {
  type: 'TOGGLE_FOCUS_ORDER';
  payload: {
    show: boolean;
  };
}

export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

export interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  payload: Partial<Settings>;
}

// Set the toolbar badge for a specific tab to a total. Sent by the side panel
// after a scan completes so the badge reflects the combined multi-scan total on
// the scanned tab, not the last audit's count (correctness-5).
export interface SetBadgeMessage {
  type: 'SET_BADGE';
  payload: {
    tabId: number;
    count: number;
  };
}

// Union type for all messages
export type Message =
  | PingMessage
  | ScanPageMessage
  | ScanResultMessage
  | ScanRequestMessage
  | ScanProgressMessage
  | CancelScanMessage
  | GetArmedTabMessage
  | HighlightElementMessage
  | HighlightAllMessage
  | ClearHighlightsMessage
  | ApplyVisionFilterMessage
  | ToggleFocusOrderMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | SetBadgeMessage;

// Response types
export interface ScanResponse {
  success: boolean;
  result?: ScanResult;
  error?: string;
  // Set when the scan was aborted by the user (Cancel) rather than failing — the
  // panel keeps any prior results and surfaces no error.
  cancelled?: boolean;
}

export interface SettingsResponse {
  success: boolean;
  settings?: Settings;
  error?: string;
}

// The armed tab (or null when nothing is armed — e.g. the tab navigated away and
// the activeTab grant lapsed). `url` is only present because the toolbar click
// granted activeTab, which reveals it.
export interface ArmedTabInfo {
  id: number;
  url: string;
}

export interface ArmedTabResponse {
  success: boolean;
  tab?: ArmedTabInfo | null;
  error?: string;
}

// Type-safe message sender
export function sendMessage<T extends Message>(message: T): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

// Type-safe tab message sender
export function sendTabMessage<T extends Message>(tabId: number, message: T): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, message);
}

// Get the current active tab
export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
