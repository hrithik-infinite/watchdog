import { create } from 'zustand';
import type { Issue, ScanResult, FilterState, Settings } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/constants';

export type AuditType =
  | 'accessibility'
  | 'performance'
  | 'seo'
  | 'security'
  | 'best-practices'
  | 'pwa'
  | 'mobile'
  | 'links'
  | 'i18n'
  | 'privacy';

interface ScanState {
  // Scan state
  isScanning: boolean;
  scanResult: ScanResult | null;
  error: string | null;

  // Audit type
  selectedAuditType: AuditType;
  selectedAuditTypes: AuditType[]; // For multi-scan rescan

  // Filter state
  filters: FilterState;

  // Ignored issues filter
  hideIgnored: boolean;
  ignoredHashes: Set<string>;

  // UI state
  selectedIssueId: string | null;
  view: 'list' | 'detail';

  // Settings
  settings: Settings;

  // Actions
  setScanning: (isScanning: boolean) => void;
  setScanResult: (result: ScanResult | null) => void;
  setError: (error: string | null) => void;
  setSelectedAuditType: (auditType: AuditType) => void;
  setSelectedAuditTypes: (auditTypes: AuditType[]) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  selectIssue: (id: string | null) => void;
  setView: (view: 'list' | 'detail') => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setHideIgnored: (hide: boolean) => void;
  setIgnoredHashes: (hashes: Set<string>) => void;

  // Computed
  getFilteredIssues: () => Issue[];
  getIssueById: (id: string) => Issue | undefined;
  getAdjacentIssueIds: (id: string) => { prev: string | null; next: string | null };
}

const initialFilters: FilterState = {
  severity: 'all',
  category: 'all',
  searchQuery: '',
};

export const useScanStore = create<ScanState>((set, get) => ({
  // Initial state
  isScanning: false,
  scanResult: null,
  error: null,
  selectedAuditType: 'accessibility',
  selectedAuditTypes: ['accessibility'],
  filters: initialFilters,
  hideIgnored: true,
  ignoredHashes: new Set(),
  selectedIssueId: null,
  view: 'list',
  settings: DEFAULT_SETTINGS,

  // Actions
  setScanning: (isScanning) => set({ isScanning }),

  setScanResult: (result) =>
    set({
      scanResult: result,
      error: null,
      selectedIssueId: null,
      view: 'list',
    }),

  setError: (error) => set({ error }),

  setSelectedAuditType: (auditType) => set({ selectedAuditType: auditType }),

  setSelectedAuditTypes: (auditTypes) => set({ selectedAuditTypes: auditTypes }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  selectIssue: (id) =>
    set({
      selectedIssueId: id,
      view: id ? 'detail' : 'list',
    }),

  setView: (view) => set({ view }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setHideIgnored: (hide) => set({ hideIgnored: hide }),

  setIgnoredHashes: (hashes) => set({ ignoredHashes: hashes }),

  // Computed
  getFilteredIssues: () => {
    const { scanResult, filters, hideIgnored, ignoredHashes } = get();
    if (!scanResult) return [];

    let issues = [...scanResult.issues];

    // Filter out ignored issues
    if (hideIgnored && ignoredHashes.size > 0) {
      issues = issues.filter((issue) => {
        const hash = `${issue.element.selector}::${issue.ruleId}`;
        return !ignoredHashes.has(hash);
      });
    }

    // Filter by severity
    if (filters.severity !== 'all') {
      issues = issues.filter((issue) => issue.severity === filters.severity);
    }

    // Filter by category
    if (filters.category !== 'all') {
      issues = issues.filter((issue) => issue.category === filters.category);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      issues = issues.filter(
        (issue) =>
          issue.message.toLowerCase().includes(query) ||
          issue.element.html.toLowerCase().includes(query) ||
          issue.ruleId.toLowerCase().includes(query)
      );
    }

    // Sort by severity (critical > serious > moderate > minor)
    const severityOrder: Record<string, number> = {
      critical: 0,
      serious: 1,
      moderate: 2,
      minor: 3,
    };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return issues;
  },

  getIssueById: (id) => {
    const { scanResult } = get();
    return scanResult?.issues.find((issue) => issue.id === id);
  },

  getAdjacentIssueIds: (id) => {
    const issues = get().getFilteredIssues();
    const index = issues.findIndex((issue) => issue.id === id);
    return {
      prev: index > 0 ? issues[index - 1].id : null,
      next: index < issues.length - 1 ? issues[index + 1].id : null,
    };
  },
}));
