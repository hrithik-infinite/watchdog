import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveScanToHistory,
  getAllScanHistory,
  getScanHistoryForDomain,
  getPreviousScan,
  deleteScanFromHistory,
  clearDomainHistory,
  clearAllHistory,
  compareScanResults,
  formatRelativeTime,
  getAllIgnoredIssues,
  getIgnoredIssuesForDomain,
  isIssueIgnored,
  ignoreIssue,
  unignoreIssue,
  clearIgnoredIssuesForDomain,
  clearAllIgnoredIssues,
  generateIssueHash,
  type ScanHistoryEntry,
  type IgnoredIssue,
  type ScanComparison,
} from '../storage';
import type { ScanResult, Issue, ScanSummary } from '../types';

// Mock Chrome API
vi.stubGlobal('chrome', {
  storage: {
    local: {
      set: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
    },
  },
});

describe('Storage - Chrome storage API wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockScanResult = (overrides?: Partial<ScanResult>): ScanResult => ({
    url: 'https://example.com',
    timestamp: Date.now(),
    duration: 1000,
    issues: [],
    incomplete: [],
    summary: {
      total: 0,
      bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      byCategory: {
        images: 0,
        interactive: 0,
        forms: 0,
        color: 0,
        document: 0,
        structure: 0,
        aria: 0,
        technical: 0,
      },
    },
    ...overrides,
  });

  const createMockIssue = (overrides?: Partial<Issue>): Issue => ({
    id: `issue-${Math.random()}`,
    ruleId: 'test-rule',
    severity: 'critical',
    category: 'images',
    message: 'Test issue',
    description: 'Test description',
    helpUrl: 'https://example.com',
    wcag: {
      id: '1.1.1',
      level: 'A',
      name: 'Test',
      description: 'Test',
    },
    element: {
      selector: '.test',
      html: '<div class="test"></div>',
    },
    fix: {
      description: 'Fix',
      code: 'code',
      learnMoreUrl: 'https://example.com',
    },
    ...overrides,
  });

  // ============================================
  // SCAN HISTORY TESTS
  // ============================================

  describe('saveScanToHistory', () => {
    it('should save scan result to history', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult();
      const entry = await saveScanToHistory(result);

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('url', result.url);
      expect(entry).toHaveProperty('timestamp', result.timestamp);
    });

    it('should generate unique ID for each entry', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult();
      const entry1 = await saveScanToHistory(result);
      const entry2 = await saveScanToHistory(result);

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should extract domain from URL', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult({
        url: 'https://example.com/path/to/page',
      });
      const entry = await saveScanToHistory(result);

      expect(entry.domain).toBe('example.com');
    });

    it('should store audit types', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult();
      const entry = await saveScanToHistory(result, ['accessibility', 'performance']);

      expect(entry.auditTypes).toContain('accessibility');
      expect(entry.auditTypes).toContain('performance');
    });

    it('should use default audit type if not provided', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult();
      const entry = await saveScanToHistory(result);

      expect(entry.auditTypes).toContain('accessibility');
    });

    it('should store issue count', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const issues = [createMockIssue(), createMockIssue()];
      const result = createMockScanResult({ issues });
      const entry = await saveScanToHistory(result);

      expect(entry.issueCount).toBe(2);
    });

    it('should maintain max 10 entries per domain', async () => {
      const existingHistory: ScanHistoryEntry[] = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `scan-${i}`,
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now() - i * 1000,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        }));

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: existingHistory,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult();
      const entry = await saveScanToHistory(result);

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_scan_history.length).toBeLessThanOrEqual(10);
    });

    it('should save to chrome.storage.local', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      const result = createMockScanResult();
      await saveScanToHistory(result);

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('getAllScanHistory', () => {
    it('should return empty array if no history exists', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});

      const history = await getAllScanHistory();

      expect(history).toEqual([]);
    });

    it('should return scan history from storage', async () => {
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });

      const history = await getAllScanHistory();

      expect(history).toEqual(mockHistory);
      expect(history.length).toBe(1);
    });

    it('should handle non-array history gracefully', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: 'not-an-array',
      });

      const history = await getAllScanHistory();

      expect(Array.isArray(history)).toBe(true);
      expect(history).toEqual([]);
    });

    it('should use correct storage key', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});

      await getAllScanHistory();

      expect(chrome.storage.local.get).toHaveBeenCalledWith('watchdog_scan_history');
    });
  });

  describe('getScanHistoryForDomain', () => {
    it('should return history for specific domain', async () => {
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
        {
          id: 'scan-2',
          url: 'https://other.com',
          domain: 'other.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });

      const history = await getScanHistoryForDomain('https://example.com');

      expect(history.length).toBe(1);
      expect(history[0].domain).toBe('example.com');
    });

    it('should sort by timestamp descending', async () => {
      const now = Date.now();
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: now - 3000,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
        {
          id: 'scan-2',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: now,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });

      const history = await getScanHistoryForDomain('https://example.com');

      expect(history[0].timestamp).toBeGreaterThan(history[1].timestamp);
    });

    it('should return empty array for domain with no history', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: [],
      });

      const history = await getScanHistoryForDomain('https://notfound.com');

      expect(history).toEqual([]);
    });
  });

  describe('getPreviousScan', () => {
    it('should return most recent scan for domain', async () => {
      const now = Date.now();
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: now - 5000,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
        {
          id: 'scan-2',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: now,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });

      const scan = await getPreviousScan('https://example.com');

      expect(scan?.id).toBe('scan-2');
    });

    it('should exclude current scan by timestamp', async () => {
      const now = Date.now();
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: now - 5000,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
        {
          id: 'scan-2',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: now,
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });

      const scan = await getPreviousScan('https://example.com', now);

      expect(scan?.id).toBe('scan-1');
    });

    it('should return null if no previous scan exists', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: [],
      });

      const scan = await getPreviousScan('https://example.com');

      expect(scan).toBeNull();
    });
  });

  describe('deleteScanFromHistory', () => {
    it('should delete scan by ID', async () => {
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await deleteScanFromHistory('scan-1');

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_scan_history.length).toBe(0);
    });

    it('should not delete unrelated scans', async () => {
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
        {
          id: 'scan-2',
          url: 'https://other.com',
          domain: 'other.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await deleteScanFromHistory('scan-1');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_scan_history.length).toBe(1);
      expect(setArg.watchdog_scan_history[0].id).toBe('scan-2');
    });
  });

  describe('clearDomainHistory', () => {
    it('should clear all scans for a domain', async () => {
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
        {
          id: 'scan-2',
          url: 'https://other.com',
          domain: 'other.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await clearDomainHistory('https://example.com');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_scan_history.length).toBe(1);
      expect(setArg.watchdog_scan_history[0].domain).toBe('other.com');
    });

    it('should extract domain from full URL', async () => {
      const mockHistory: ScanHistoryEntry[] = [
        {
          id: 'scan-1',
          url: 'https://example.com/path',
          domain: 'example.com',
          auditTypes: ['accessibility'],
          timestamp: Date.now(),
          duration: 1000,
          summary: {
            total: 0,
            bySeverity: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            byCategory: {
              images: 0,
              interactive: 0,
              forms: 0,
              color: 0,
              document: 0,
              structure: 0,
              aria: 0,
              technical: 0,
            },
          },
          issueCount: 0,
          issues: [],
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_scan_history: mockHistory,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await clearDomainHistory('https://example.com/page/path');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_scan_history.length).toBe(0);
    });
  });

  describe('clearAllHistory', () => {
    it('should remove scan history key from storage', async () => {
      (chrome.storage.local.remove as any) = vi.fn().mockResolvedValue(undefined);

      await clearAllHistory();

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('watchdog_scan_history');
    });
  });

  // ============================================
  // SCAN COMPARISON TESTS
  // ============================================

  describe('compareScanResults', () => {
    it('should compare two scan results', async () => {
      const now = Date.now();
      const previous: ScanHistoryEntry = {
        id: 'scan-1',
        url: 'https://example.com',
        domain: 'example.com',
        auditTypes: ['accessibility'],
        timestamp: now - 5000,
        duration: 1000,
        summary: {
          total: 2,
          bySeverity: { critical: 1, serious: 1, moderate: 0, minor: 0 },
          byCategory: {
            images: 2,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
        issueCount: 2,
        issues: [
          createMockIssue({ ruleId: 'rule-1', severity: 'critical' }),
          createMockIssue({ ruleId: 'rule-2', severity: 'serious' }),
        ],
      };

      const current = createMockScanResult({
        timestamp: now,
        issues: [createMockIssue({ ruleId: 'rule-1', severity: 'critical' })],
      });

      const comparison = compareScanResults(current, previous);

      expect(comparison).toHaveProperty('current');
      expect(comparison).toHaveProperty('previous');
      expect(comparison).toHaveProperty('diff');
      expect(comparison).toHaveProperty('fixedIssues');
      expect(comparison).toHaveProperty('newIssues');
      expect(comparison).toHaveProperty('unchangedCount');
    });

    it('should identify fixed issues', () => {
      const now = Date.now();
      const previous: ScanHistoryEntry = {
        id: 'scan-1',
        url: 'https://example.com',
        domain: 'example.com',
        auditTypes: ['accessibility'],
        timestamp: now - 5000,
        duration: 1000,
        summary: {
          total: 2,
          bySeverity: { critical: 2, serious: 0, moderate: 0, minor: 0 },
          byCategory: {
            images: 2,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
        issueCount: 2,
        issues: [
          createMockIssue({
            ruleId: 'rule-1',
            element: { selector: '.test1', html: '<div></div>' },
          }),
          createMockIssue({
            ruleId: 'rule-2',
            element: { selector: '.test2', html: '<div></div>' },
          }),
        ],
      };

      const current = createMockScanResult({
        timestamp: now,
        issues: [
          createMockIssue({
            ruleId: 'rule-1',
            element: { selector: '.test1', html: '<div></div>' },
          }),
        ],
      });

      const comparison = compareScanResults(current, previous);

      expect(comparison.fixedIssues.length).toBe(1);
      expect(comparison.fixedIssues[0].ruleId).toBe('rule-2');
    });

    it('should identify new issues', () => {
      const now = Date.now();
      const previous: ScanHistoryEntry = {
        id: 'scan-1',
        url: 'https://example.com',
        domain: 'example.com',
        auditTypes: ['accessibility'],
        timestamp: now - 5000,
        duration: 1000,
        summary: {
          total: 1,
          bySeverity: { critical: 1, serious: 0, moderate: 0, minor: 0 },
          byCategory: {
            images: 1,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
        issueCount: 1,
        issues: [
          createMockIssue({
            ruleId: 'rule-1',
            element: { selector: '.test1', html: '<div></div>' },
          }),
        ],
      };

      const current = createMockScanResult({
        timestamp: now,
        issues: [
          createMockIssue({
            ruleId: 'rule-1',
            element: { selector: '.test1', html: '<div></div>' },
          }),
          createMockIssue({
            ruleId: 'rule-2',
            element: { selector: '.test2', html: '<div></div>' },
          }),
        ],
      });

      const comparison = compareScanResults(current, previous);

      expect(comparison.newIssues.length).toBe(1);
      expect(comparison.newIssues[0].ruleId).toBe('rule-2');
    });

    it('should count unchanged issues', () => {
      const now = Date.now();
      const issue1 = createMockIssue({
        ruleId: 'rule-1',
        element: { selector: '.test1', html: '<div></div>' },
      });
      const issue2 = createMockIssue({
        ruleId: 'rule-2',
        element: { selector: '.test2', html: '<div></div>' },
      });

      const previous: ScanHistoryEntry = {
        id: 'scan-1',
        url: 'https://example.com',
        domain: 'example.com',
        auditTypes: ['accessibility'],
        timestamp: now - 5000,
        duration: 1000,
        summary: {
          total: 2,
          bySeverity: { critical: 2, serious: 0, moderate: 0, minor: 0 },
          byCategory: {
            images: 2,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
        issueCount: 2,
        issues: [issue1, issue2],
      };

      const current = createMockScanResult({
        timestamp: now,
        issues: [issue1, issue2],
      });

      const comparison = compareScanResults(current, previous);

      expect(comparison.unchangedCount).toBe(2);
    });

    it('should calculate severity differences', () => {
      const now = Date.now();
      const previous: ScanHistoryEntry = {
        id: 'scan-1',
        url: 'https://example.com',
        domain: 'example.com',
        auditTypes: ['accessibility'],
        timestamp: now - 5000,
        duration: 1000,
        summary: {
          total: 5,
          bySeverity: { critical: 2, serious: 2, moderate: 1, minor: 0 },
          byCategory: {
            images: 5,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
        issueCount: 5,
        issues: [],
      };

      const current = createMockScanResult({
        timestamp: now,
        issues: [],
        summary: {
          total: 3,
          bySeverity: { critical: 1, serious: 1, moderate: 1, minor: 0 },
          byCategory: {
            images: 3,
            interactive: 0,
            forms: 0,
            color: 0,
            document: 0,
            structure: 0,
            aria: 0,
            technical: 0,
          },
        },
      });

      const comparison = compareScanResults(current, previous);

      // Note: issueCount changes from 5 to 0 (because current has 0 issues in our test)
      // In real scenario with proper issues the counts would match
      expect(comparison.diff.bySeverity.critical).toBe(-1);
      expect(comparison.diff.bySeverity.serious).toBe(-1);
      expect(comparison.diff.bySeverity.moderate).toBe(0);
    });
  });

  describe('formatRelativeTime', () => {
    it('should format "just now" for recent timestamps', () => {
      const now = Date.now();
      const formatted = formatRelativeTime(now);

      expect(formatted).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      const formatted = formatRelativeTime(fiveMinutesAgo);

      expect(formatted).toContain('m ago');
      expect(formatted).toContain('5');
    });

    it('should format hours ago', () => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      const formatted = formatRelativeTime(twoHoursAgo);

      expect(formatted).toContain('h ago');
      expect(formatted).toContain('2');
    });

    it('should format yesterday', () => {
      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;

      const formatted = formatRelativeTime(yesterday);

      expect(formatted).toBe('Yesterday');
    });

    it('should format days ago', () => {
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      const formatted = formatRelativeTime(threeDaysAgo);

      expect(formatted).toContain('days ago');
      expect(formatted).toContain('3');
    });

    it('should format date for older timestamps', () => {
      const now = Date.now();
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

      const formatted = formatRelativeTime(tenDaysAgo);

      // Should be a date string
      expect(formatted).not.toContain('ago');
    });
  });

  // ============================================
  // IGNORED ISSUES TESTS
  // ============================================

  describe('generateIssueHash', () => {
    it('should generate hash from selector and ruleId', () => {
      const hash = generateIssueHash('.test', 'rule-1');

      expect(hash).toBe('.test::rule-1');
    });

    it('should be consistent', () => {
      const hash1 = generateIssueHash('.test', 'rule-1');
      const hash2 = generateIssueHash('.test', 'rule-1');

      expect(hash1).toBe(hash2);
    });

    it('should differ for different inputs', () => {
      const hash1 = generateIssueHash('.test1', 'rule-1');
      const hash2 = generateIssueHash('.test2', 'rule-1');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getAllIgnoredIssues', () => {
    it('should return empty array if no ignored issues', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});

      const ignored = await getAllIgnoredIssues();

      expect(ignored).toEqual([]);
    });

    it('should return all ignored issues', async () => {
      const mockIgnored: IgnoredIssue[] = [
        {
          hash: '.test::rule-1',
          selector: '.test',
          ruleId: 'rule-1',
          message: 'Test issue',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });

      const ignored = await getAllIgnoredIssues();

      expect(ignored).toEqual(mockIgnored);
    });

    it('should use correct storage key', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({});

      await getAllIgnoredIssues();

      expect(chrome.storage.local.get).toHaveBeenCalledWith('watchdog_ignored_issues');
    });
  });

  describe('getIgnoredIssuesForDomain', () => {
    it('should return ignored issues for specific domain', async () => {
      const mockIgnored: IgnoredIssue[] = [
        {
          hash: '.test::rule-1',
          selector: '.test',
          ruleId: 'rule-1',
          message: 'Test issue',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
        {
          hash: '.other::rule-2',
          selector: '.other',
          ruleId: 'rule-2',
          message: 'Other issue',
          reason: 'false-positive',
          ignoredAt: Date.now(),
          domain: 'other.com',
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });

      const ignored = await getIgnoredIssuesForDomain('https://example.com');

      expect(ignored.length).toBe(1);
      expect(ignored[0].domain).toBe('example.com');
    });
  });

  describe('isIssueIgnored', () => {
    it('should return true if issue is ignored', async () => {
      const mockIgnored: IgnoredIssue[] = [
        {
          hash: '.test::rule-1',
          selector: '.test',
          ruleId: 'rule-1',
          message: 'Test issue',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });

      const isIgnored = await isIssueIgnored('https://example.com', '.test', 'rule-1');

      expect(isIgnored).toBe(true);
    });

    it('should return false if issue is not ignored', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: [],
      });

      const isIgnored = await isIssueIgnored('https://example.com', '.test', 'rule-1');

      expect(isIgnored).toBe(false);
    });

    it('should check both hash and domain', async () => {
      const mockIgnored: IgnoredIssue[] = [
        {
          hash: '.test::rule-1',
          selector: '.test',
          ruleId: 'rule-1',
          message: 'Test issue',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });

      const isIgnoredSameDomain = await isIssueIgnored('https://example.com', '.test', 'rule-1');
      expect(isIgnoredSameDomain).toBe(true);

      // Reset mock for second call
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });

      const isIgnoredDifferentDomain = await isIssueIgnored('https://other.com', '.test', 'rule-1');
      expect(isIgnoredDifferentDomain).toBe(false);
    });
  });

  describe('ignoreIssue', () => {
    it('should add issue to ignored list', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: [],
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await ignoreIssue('https://example.com', '.test', 'rule-1', 'Test message', 'third-party');

      expect(chrome.storage.local.set).toHaveBeenCalled();
      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_ignored_issues.length).toBe(1);
      expect(setArg.watchdog_ignored_issues[0].domain).toBe('example.com');
    });

    it('should include custom note if provided', async () => {
      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: [],
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await ignoreIssue(
        'https://example.com',
        '.test',
        'rule-1',
        'Test message',
        'other',
        'Custom note'
      );

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_ignored_issues[0].customNote).toBe('Custom note');
    });

    it('should replace existing ignored issue', async () => {
      const existing: IgnoredIssue = {
        hash: '.test::rule-1',
        selector: '.test',
        ruleId: 'rule-1',
        message: 'Old message',
        reason: 'false-positive',
        ignoredAt: Date.now() - 5000,
        domain: 'example.com',
      };

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: [existing],
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await ignoreIssue('https://example.com', '.test', 'rule-1', 'New message', 'third-party');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_ignored_issues.length).toBe(1);
      expect(setArg.watchdog_ignored_issues[0].reason).toBe('third-party');
      expect(setArg.watchdog_ignored_issues[0].message).toBe('New message');
    });
  });

  describe('unignoreIssue', () => {
    it('should remove issue from ignored list', async () => {
      const ignored: IgnoredIssue = {
        hash: '.test::rule-1',
        selector: '.test',
        ruleId: 'rule-1',
        message: 'Test message',
        reason: 'third-party',
        ignoredAt: Date.now(),
        domain: 'example.com',
      };

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: [ignored],
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await unignoreIssue('https://example.com', '.test', 'rule-1');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_ignored_issues.length).toBe(0);
    });

    it('should not remove unrelated ignored issues', async () => {
      const mockIgnored: IgnoredIssue[] = [
        {
          hash: '.test::rule-1',
          selector: '.test',
          ruleId: 'rule-1',
          message: 'Test message',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
        {
          hash: '.other::rule-2',
          selector: '.other',
          ruleId: 'rule-2',
          message: 'Other message',
          reason: 'false-positive',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await unignoreIssue('https://example.com', '.test', 'rule-1');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_ignored_issues.length).toBe(1);
      expect(setArg.watchdog_ignored_issues[0].ruleId).toBe('rule-2');
    });
  });

  describe('clearIgnoredIssuesForDomain', () => {
    it('should clear ignored issues for domain', async () => {
      const mockIgnored: IgnoredIssue[] = [
        {
          hash: '.test::rule-1',
          selector: '.test',
          ruleId: 'rule-1',
          message: 'Test message',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
        {
          hash: '.other::rule-2',
          selector: '.other',
          ruleId: 'rule-2',
          message: 'Other message',
          reason: 'false-positive',
          ignoredAt: Date.now(),
          domain: 'other.com',
        },
      ];

      (chrome.storage.local.get as any) = vi.fn().mockResolvedValue({
        watchdog_ignored_issues: mockIgnored,
      });
      (chrome.storage.local.set as any) = vi.fn().mockResolvedValue(undefined);

      await clearIgnoredIssuesForDomain('https://example.com');

      const setArg = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setArg.watchdog_ignored_issues.length).toBe(1);
      expect(setArg.watchdog_ignored_issues[0].domain).toBe('other.com');
    });
  });

  describe('clearAllIgnoredIssues', () => {
    it('should remove ignored issues key from storage', async () => {
      (chrome.storage.local.remove as any) = vi.fn().mockResolvedValue(undefined);

      await clearAllIgnoredIssues();

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('watchdog_ignored_issues');
    });
  });
});
