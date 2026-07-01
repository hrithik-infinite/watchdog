import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllIgnoredIssues,
  clearIgnoredIssuesForDomain,
  generateIssueHash,
  getAllIgnoredIssues,
  getIgnoredIssuesForDomain,
  type IgnoredIssue,
  ignoreIssue,
  isIssueIgnored,
  unignoreIssue,
} from '../storage';

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

  // ============================================
  // REGRESSION: correctness-7 — concurrent writes
  // ============================================

  describe('ignoreIssue concurrency (correctness-7)', () => {
    it('serializes concurrent ignoreIssue writes so neither update is lost', async () => {
      // Buggy behavior: read-modify-write on chrome.storage.local was non-atomic.
      // Two concurrent ignoreIssue calls both read the same empty baseline, so the
      // second set() clobbered the first and one ignored issue was silently lost
      // (store ended with length 1 instead of 2).
      let store: IgnoredIssue[] = [];
      (chrome.storage.local.get as any) = vi
        .fn()
        .mockImplementation(async () => ({ watchdog_ignored_issues: store }));
      (chrome.storage.local.set as any) = vi.fn().mockImplementation(async (obj: any) => {
        store = obj.watchdog_ignored_issues;
      });

      await Promise.all([
        ignoreIssue('https://example.com', '.a', 'rule-a', 'A', 'third-party'),
        ignoreIssue('https://example.com', '.b', 'rule-b', 'B', 'third-party'),
      ]);

      expect(store.length).toBe(2);
      expect(store.map((i) => i.ruleId).sort()).toEqual(['rule-a', 'rule-b']);
    });

    it('does not lose a concurrent ignore when interleaved with unignore', async () => {
      // Same root cause: interleaved ignore + unignore on different hashes must
      // both land; previously the later write overwrote the earlier one.
      let store: IgnoredIssue[] = [
        {
          hash: '.old::rule-old',
          selector: '.old',
          ruleId: 'rule-old',
          message: 'old',
          reason: 'third-party',
          ignoredAt: Date.now(),
          domain: 'example.com',
        },
      ];
      (chrome.storage.local.get as any) = vi
        .fn()
        .mockImplementation(async () => ({ watchdog_ignored_issues: store }));
      (chrome.storage.local.set as any) = vi.fn().mockImplementation(async (obj: any) => {
        store = obj.watchdog_ignored_issues;
      });

      await Promise.all([
        ignoreIssue('https://example.com', '.new', 'rule-new', 'new', 'third-party'),
        unignoreIssue('https://example.com', '.old', 'rule-old'),
      ]);

      expect(store.map((i) => i.ruleId)).toEqual(['rule-new']);
    });
  });
});
