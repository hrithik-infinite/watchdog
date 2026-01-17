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

  // Filter state
  filters: FilterState;

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
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  selectIssue: (id: string | null) => void;
  setView: (view: 'list' | 'detail') => void;
  updateSettings: (settings: Partial<Settings>) => void;

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
  filters: initialFilters,
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

  setError: (error) => set({ error, isScanning: false }),

  setSelectedAuditType: (auditType) => set({ selectedAuditType: auditType }),

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

  // Computed
  getFilteredIssues: () => {
    const { scanResult, filters } = get();
    if (!scanResult) return [];

    let issues = [...scanResult.issues];

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
