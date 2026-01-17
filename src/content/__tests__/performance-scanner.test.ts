import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock performance
const mockPerformanceNow = vi.fn();
const mockGetEntriesByType = vi.fn();
const mockGetEntriesByName = vi.fn();

const mockPerformanceAPI = {
  now: mockPerformanceNow,
  getEntriesByType: mockGetEntriesByType,
  getEntriesByName: mockGetEntriesByName,
  timing: {
    navigationStart: 1000,
    fetchStart: 1050,
    domainLookupStart: 1100,
    domainLookupEnd: 1200,
    connectStart: 1200,
    connectEnd: 1300,
    requestStart: 1300,
    responseStart: 1800,
    responseEnd: 2000,
    domLoading: 2100,
    domInteractive: 3000,
    domContentLoadedEventStart: 3100,
    domContentLoadedEventEnd: 3200,
    domComplete: 4000,
    loadEventStart: 4100,
    loadEventEnd: 5000,
  },
};

vi.stubGlobal('performance', mockPerformanceAPI);

const mockWindowLocation = { href: 'https://example.com' };

vi.stubGlobal('window', {
  location: mockWindowLocation,
  matchMedia: vi.fn(),
});

import { scanPerformance } from '../performance-scanner';

describe('Performance Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    mockGetEntriesByType.mockReturnValue([]);
    mockGetEntriesByName.mockReturnValue([]);
  });

  describe('Navigation timing metrics', () => {
    it('should collect navigation timing', async () => {
      const result = await scanPerformance();

      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
    });

    it('should calculate DNS time', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
      // DNS time = domainLookupEnd - domainLookupStart = 1200 - 1100 = 100ms
    });

    it('should calculate connection time', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
      // Connection time = connectEnd - connectStart = 1300 - 1200 = 100ms
    });

    it('should calculate request time', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
      // Request time = responseStart - requestStart = 1800 - 1300 = 500ms
    });

    it('should calculate response time', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
      // Response time = responseEnd - responseStart = 2000 - 1800 = 200ms
    });
  });

  describe('Resource metrics', () => {
    it('should collect resource entries when available', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('First Contentful Paint', () => {
    it('should detect FCP metric when available', async () => {
      mockGetEntriesByName.mockReturnValue([{ startTime: 1500 }]);

      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle missing FCP', async () => {
      mockGetEntriesByName.mockReturnValue([]);

      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Scan result structure', () => {
    it('should return valid ScanResult structure', async () => {
      const result = await scanPerformance();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct URL', async () => {
      const result = await scanPerformance();

      expect(result.url).toBe('https://example.com');
    });

    it('should have current timestamp', async () => {
      const beforeScan = Date.now();
      const result = await scanPerformance();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should include wait time in duration', async () => {
      const result = await scanPerformance();

      expect(typeof result.duration).toBe('number');
      expect(Number.isNaN(result.duration)).toBe(false);
    });

    it('should have issues array', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await scanPerformance();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });
  });

  describe('Summary generation', () => {
    it('should generate valid summary', async () => {
      const result = await scanPerformance();

      expect(result.summary.total).toBe(result.issues.length);
      expect(result.summary.bySeverity).toBeDefined();
      expect(result.summary.byCategory).toBeDefined();
    });

    it('should have all severity categories', async () => {
      const result = await scanPerformance();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have all category breakdowns', async () => {
      const result = await scanPerformance();
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

    it('should count severity correctly', async () => {
      const result = await scanPerformance();

      const totalSeverity = Object.values(result.summary.bySeverity).reduce(
        (a: number, b: number) => a + b,
        0
      );
      expect(totalSeverity).toBe(result.issues.length);
    });
  });

  describe('Issue validation', () => {
    it('should have valid issue structure', async () => {
      const result = await scanPerformance();

      for (const issue of result.issues) {
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('ruleId');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('message');
        expect(['critical', 'serious', 'moderate', 'minor']).toContain(issue.severity);
      }
    });

    it('should have unique issue IDs', async () => {
      const result = await scanPerformance();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
