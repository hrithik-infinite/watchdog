import type { ScanResult, Settings, Severity, VisionMode } from './types';

export type AuditType =
  'accessibility' | 'performance' | 'seo' | 'security' | 'best-practices' | 'pwa';

// Message types for communication between extension parts
export type MessageType =
  | 'PING'
  | 'SCAN_PAGE'
  | 'SCAN_RESULT'
  | 'HIGHLIGHT_ELEMENT'
  | 'HIGHLIGHT_ALL'
  | 'CLEAR_HIGHLIGHTS'
  | 'APPLY_VISION_FILTER'
  | 'TOGGLE_FOCUS_ORDER'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'OPEN_SIDEPANEL'
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

export interface OpenSidePanelMessage {
  type: 'OPEN_SIDEPANEL';
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
  | HighlightElementMessage
  | HighlightAllMessage
  | ClearHighlightsMessage
  | ApplyVisionFilterMessage
  | ToggleFocusOrderMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | OpenSidePanelMessage
  | SetBadgeMessage;

// Response types
export interface ScanResponse {
  success: boolean;
  result?: ScanResult;
  error?: string;
}

export interface SettingsResponse {
  success: boolean;
  settings?: Settings;
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
