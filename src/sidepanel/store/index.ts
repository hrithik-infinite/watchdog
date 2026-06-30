import { create } from 'zustand';
import type { Issue, ScanResult, FilterState, Settings, WCAGLevel } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/constants';
import { isWcagIssue } from '../lib/standards';

// Higher number = stricter conformance level. Selecting a level shows that level
// and everything below it (AA shows A+AA; A shows only A).
const WCAG_LEVEL_RANK: Record<WCAGLevel, number> = { A: 1, AA: 2, AAA: 3 };

export type AuditType =
  | 'accessibility'
  | 'performance'
  | 'seo'
  | 'security'
  | 'best-practices'
  | 'pwa';

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

  // Debounced mirror of filters.searchQuery that actually drives filtering.
  // filters.searchQuery updates on every keystroke (keeps the search input
  // responsive); this trails it by SEARCH_DEBOUNCE_MS so getFilteredIssues'
  // filter+sort pass isn't re-run on each keystroke (perf-rel-7). Internal:
  // consumers should keep reading/binding filters.searchQuery.
  debouncedSearchQuery: string;

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

// Delay (ms) before a typed search query feeds the filtering pass. Small enough
// to feel instant while still collapsing a burst of keystrokes into one
// filter+sort run instead of one per character (perf-rel-7).
const SEARCH_DEBOUNCE_MS = 200;

// Snapshot of every input getFilteredIssues depends on, paired with the array it
// produced. Compared field-by-field on the next call so an unchanged store
// returns the SAME array reference instead of re-running the filter+sort.
interface FilteredIssuesCache {
  scanResult: ScanResult | null;
  severity: FilterState['severity'];
  category: FilterState['category'];
  searchQuery: string;
  hideIgnored: boolean;
  ignoredHashes: Set<string>;
  wcagLevel: WCAGLevel;
  result: Issue[];
}

// Memo cache + debounce handle for the singleton store. Module-scoped (like a
// reselect selector's cache) rather than reactive state so they never trigger a
// render on their own. ignoredHashes is always replaced wholesale (never mutated
// in place), so reference comparison is sufficient for invalidation.
let filteredCache: FilteredIssuesCache | null = null;
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useScanStore = create<ScanState>((set, get) => ({
  // Initial state
  isScanning: false,
  scanResult: null,
  error: null,
  selectedAuditType: 'accessibility',
  selectedAuditTypes: ['accessibility'],
  filters: initialFilters,
  debouncedSearchQuery: '',
  hideIgnored: true,
  ignoredHashes: new Set(),
  selectedIssueId: null,
  view: 'list',
  settings: DEFAULT_SETTINGS,

  // Actions
  setScanning: (isScanning) => set({ isScanning }),

  // Note: setScanResult does NOT touch `error`. Error is owned independently and
  // cleared explicitly at the start of each scan. Coupling them here caused a
  // failed scan (setError then setScanResult(null)) to wipe its own message, and
  // a partial multi-scan (setScanResult then setError) to be hidden by the UI.
  setScanResult: (result) =>
    set({
      scanResult: result,
      selectedIssueId: null,
      view: 'list',
    }),

  setError: (error) => set({ error }),

  setSelectedAuditType: (auditType) => set({ selectedAuditType: auditType }),

  setSelectedAuditTypes: (auditTypes) => set({ selectedAuditTypes: auditTypes }),

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    // The search query is debounced: filters.searchQuery updated synchronously
    // above so the bound input stays responsive, but the value getFilteredIssues
    // filters on (debouncedSearchQuery) is deferred so the filter+sort doesn't
    // run on every keystroke (perf-rel-7). All other filters apply immediately.
    if (key === 'searchQuery') {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      const nextQuery = value as string;
      searchDebounceTimer = setTimeout(() => {
        searchDebounceTimer = null;
        set({ debouncedSearchQuery: nextQuery });
      }, SEARCH_DEBOUNCE_MS);
    }
  },

  resetFilters: () => {
    // Cancel any in-flight debounced search so a stale query can't re-apply
    // after the reset.
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    set({ filters: initialFilters, debouncedSearchQuery: '' });
  },

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
    const { scanResult, filters, hideIgnored, ignoredHashes, settings, debouncedSearchQuery } =
      get();

    // Return the previously computed list when every input that feeds the
    // filter+sort is unchanged. Keeps the array reference stable across renders
    // and avoids re-running the pass on every keystroke (perf-rel-7). We key on
    // debouncedSearchQuery (not filters.searchQuery), so typing doesn't bust the
    // cache until the debounce settles.
    if (
      filteredCache &&
      filteredCache.scanResult === scanResult &&
      filteredCache.severity === filters.severity &&
      filteredCache.category === filters.category &&
      filteredCache.searchQuery === debouncedSearchQuery &&
      filteredCache.hideIgnored === hideIgnored &&
      filteredCache.ignoredHashes === ignoredHashes &&
      filteredCache.wcagLevel === settings.wcagLevel
    ) {
      return filteredCache.result;
    }

    // No scan yet → empty list (filters/sort below are no-ops on it). Still cached
    // so repeated calls return the same reference.
    let issues = scanResult ? [...scanResult.issues] : [];

    // Filter out ignored issues
    if (hideIgnored && ignoredHashes.size > 0) {
      issues = issues.filter((issue) => {
        const hash = `${issue.element.selector}::${issue.ruleId}`;
        return !ignoredHashes.has(hash);
      });
    }

    // WCAG conformance-level filter — applies only to accessibility issues; other
    // audits (Performance/SEO/…) are not graded by WCAG level and pass through.
    const maxLevel = WCAG_LEVEL_RANK[settings.wcagLevel];
    issues = issues.filter((issue) =>
      isWcagIssue(issue.standard) ? WCAG_LEVEL_RANK[issue.wcag.level] <= maxLevel : true
    );

    // Filter by severity
    if (filters.severity !== 'all') {
      issues = issues.filter((issue) => issue.severity === filters.severity);
    }

    // Filter by category
    if (filters.category !== 'all') {
      issues = issues.filter((issue) => issue.category === filters.category);
    }

    // Filter by search query (debounced — see debouncedSearchQuery)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
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

    filteredCache = {
      scanResult,
      severity: filters.severity,
      category: filters.category,
      searchQuery: debouncedSearchQuery,
      hideIgnored,
      ignoredHashes,
      wcagLevel: settings.wcagLevel,
      result: issues,
    };
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
