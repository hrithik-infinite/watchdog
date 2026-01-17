import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window and performance
const mockPerformanceNow = vi.fn();
const mockWindowLocation = { href: 'https://example.com' };

vi.stubGlobal('window', {
  location: mockWindowLocation,
  matchMedia: vi.fn(),
});

vi.stubGlobal('performance', {
  now: mockPerformanceNow,
});

import { scanBestPractices } from '../best-practices-scanner';

describe('Best Practices Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(100);
  });

  describe('Scan execution', () => {
    it('should return a ScanResult object', async () => {
      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct URL from window.location', async () => {
      const result = await scanBestPractices();

      expect(result.url).toBe('https://example.com');
    });

    it('should set current timestamp', async () => {
      const beforeScan = Date.now();
      const result = await scanBestPractices();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should calculate scan duration', async () => {
      const result = await scanBestPractices();

      expect(result.duration).toBe(100);
      expect(typeof result.duration).toBe('number');
    });

    it('should have issues array', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await scanBestPractices();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });

    it('should have valid summary structure', async () => {
      const result = await scanBestPractices();
      const { summary } = result;

      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('bySeverity');
      expect(summary).toHaveProperty('byCategory');
      expect(typeof summary.total).toBe('number');
    });
  });

  describe('Issue structure', () => {
    it('should have valid issue objects if issues found', async () => {
      const result = await scanBestPractices();

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('ruleId');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('message');
      }
    });

    it('should have valid severity values', async () => {
      const result = await scanBestPractices();
      const validSeverities = ['critical', 'serious', 'moderate', 'minor'];

      for (const issue of result.issues) {
        expect(validSeverities).toContain(issue.severity);
      }
    });

    it('should have valid category values', async () => {
      const result = await scanBestPractices();
      const validCategories = [
        'images',
        'interactive',
        'forms',
        'color',
        'document',
        'structure',
        'aria',
        'technical',
      ];

      for (const issue of result.issues) {
        expect(validCategories).toContain(issue.category);
      }
    });

    it('should have unique issue IDs', async () => {
      const result = await scanBestPractices();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Summary generation', () => {
    it('should have correct total count', async () => {
      const result = await scanBestPractices();

      expect(result.summary.total).toBe(result.issues.length);
    });

    it('should have severity breakdown', async () => {
      const result = await scanBestPractices();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have category breakdown', async () => {
      const result = await scanBestPractices();
      const categories = [
        'images',
        'interactive',
        'forms',
        'color',
        'document',
        'structure',
        'aria',
        'technical',
      ];

      for (const category of categories) {
        expect(result.summary.byCategory).toHaveProperty(category);
      }
    });

    it('should have valid severity counts', async () => {
      const result = await scanBestPractices();

      const severityCounts = Object.values(result.summary.bySeverity);
      const totalFromSeverity = severityCounts.reduce((a, b) => a + b, 0);

      expect(totalFromSeverity).toBe(result.summary.total);
    });

    it('should have valid category counts', async () => {
      const result = await scanBestPractices();

      const categoryCounts = Object.values(result.summary.byCategory);
      const totalFromCategories = categoryCounts.reduce((a, b) => a + b, 0);

      expect(totalFromCategories).toBe(result.summary.total);
    });
  });

  describe('Performance', () => {
    it('should complete scan', async () => {
      const result = await scanBestPractices();

      expect(result).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should be callable multiple times', async () => {
      mockPerformanceNow
        .mockReturnValue(0)
        .mockReturnValue(50)
        .mockReturnValue(0)
        .mockReturnValue(75);

      const result1 = await scanBestPractices();
      const result2 = await scanBestPractices();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
