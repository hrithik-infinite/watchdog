import type { ScanResult, Settings, Severity, VisionMode } from './types';

// Message types for communication between extension parts
export type MessageType =
  | 'PING'
  | 'SCAN_PAGE'
  | 'SCAN_RESULT'
  | 'HIGHLIGHT_ELEMENT'
  | 'CLEAR_HIGHLIGHTS'
  | 'APPLY_VISION_FILTER'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'OPEN_SIDEPANEL';

// Message payloads
export interface PingMessage {
  type: 'PING';
}

export interface ScanPageMessage {
  type: 'SCAN_PAGE';
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

export interface ClearHighlightsMessage {
  type: 'CLEAR_HIGHLIGHTS';
}

export interface ApplyVisionFilterMessage {
  type: 'APPLY_VISION_FILTER';
  payload: {
    mode: VisionMode;
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

// Union type for all messages
export type Message =
  | PingMessage
  | ScanPageMessage
  | ScanResultMessage
  | HighlightElementMessage
  | ClearHighlightsMessage
  | ApplyVisionFilterMessage
  | GetSettingsMessage
  | UpdateSettingsMessage
  | OpenSidePanelMessage;

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
