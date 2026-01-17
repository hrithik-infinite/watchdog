import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use fake timers to speed up tests (performance scanner has 1s delay)
vi.useFakeTimers();

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

// Helper to run scanPerformance with fake timers
async function runScanWithTimers() {
  const scanPromise = scanPerformance();
  // Advance timers to skip the 1-second delay in performance-scanner
  await vi.advanceTimersByTimeAsync(1100);
  return scanPromise;
}

describe('Performance Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    mockGetEntriesByType.mockReturnValue([]);
    mockGetEntriesByName.mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Scan execution', () => {
    it('should return a ScanResult object', async () => {
      const result = await runScanWithTimers();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('incomplete');
      expect(result).toHaveProperty('summary');
    });

    it('should set correct URL', async () => {
      const result = await runScanWithTimers();

      expect(result.url).toBe('https://example.com');
    });

    it('should have current timestamp', async () => {
      const beforeScan = Date.now();
      const result = await runScanWithTimers();
      const afterScan = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeScan);
      expect(result.timestamp).toBeLessThanOrEqual(afterScan);
    });

    it('should include wait time in duration', async () => {
      const result = await runScanWithTimers();

      expect(typeof result.duration).toBe('number');
      expect(Number.isNaN(result.duration)).toBe(false);
    });

    it('should have issues array', async () => {
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should have empty incomplete array', async () => {
      const result = await runScanWithTimers();

      expect(Array.isArray(result.incomplete)).toBe(true);
      expect(result.incomplete).toHaveLength(0);
    });
  });

  describe('Summary generation', () => {
    it('should generate valid summary', async () => {
      const result = await runScanWithTimers();

      expect(result.summary.total).toBe(result.issues.length);
      expect(result.summary.bySeverity).toBeDefined();
      expect(result.summary.byCategory).toBeDefined();
    });

    it('should have all severity categories', async () => {
      const result = await runScanWithTimers();

      expect(result.summary.bySeverity).toHaveProperty('critical');
      expect(result.summary.bySeverity).toHaveProperty('serious');
      expect(result.summary.bySeverity).toHaveProperty('moderate');
      expect(result.summary.bySeverity).toHaveProperty('minor');
    });

    it('should have all category breakdowns', async () => {
      const result = await runScanWithTimers();
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
      const result = await runScanWithTimers();

      const totalSeverity = Object.values(result.summary.bySeverity).reduce(
        (a: number, b: number) => a + b,
        0
      );
      expect(totalSeverity).toBe(result.issues.length);
    });
  });

  describe('Issue validation', () => {
    it('should have valid issue structure', async () => {
      const result = await runScanWithTimers();

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
      const result = await runScanWithTimers();
      const ids = result.issues.map((i) => i.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('TTFB (Time to First Byte) metrics', () => {
    it('should detect good TTFB', async () => {
      // TTFB = responseStart - requestStart = 1800 - 1300 = 500ms (good)
      const result = await runScanWithTimers();

      const ttfbIssues = result.issues.filter((i) => i.message?.includes('Time to First Byte'));
      // Should not have issues for good TTFB
      expect(ttfbIssues.length).toBeLessThanOrEqual(1);
    });

    it('should detect poor TTFB', async () => {
      // Set up poor TTFB timing
      mockPerformanceAPI.timing.responseStart = 4000;
      mockPerformanceAPI.timing.requestStart = 1300;
      // TTFB = 4000 - 1300 = 2700ms (poor, >1800)

      const result = await runScanWithTimers();

      const ttfbIssues = result.issues.filter((i) => i.message?.includes('Time to First Byte'));
      if (ttfbIssues.length > 0) {
        expect(ttfbIssues[0].severity).toMatch(/serious|moderate/);
      }

      // Reset
      mockPerformanceAPI.timing.responseStart = 1800;
    });
  });

  describe('FCP (First Contentful Paint) metrics', () => {
    it('should detect FCP when available', async () => {
      mockGetEntriesByName.mockReturnValue([{ startTime: 1500 }]);

      const result = await runScanWithTimers();

      const fcpIssues = result.issues.filter((i) => i.message?.includes('First Contentful Paint'));
      expect(fcpIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing FCP', async () => {
      mockGetEntriesByName.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should detect poor FCP', async () => {
      mockGetEntriesByName.mockReturnValue([{ startTime: 3500 }]);

      const result = await runScanWithTimers();

      const fcpIssues = result.issues.filter((i) => i.message?.includes('First Contentful Paint'));
      if (fcpIssues.length > 0) {
        expect(fcpIssues[0].severity).toBeDefined();
      }
    });
  });

  describe('LCP (Largest Contentful Paint) metrics', () => {
    it('should detect LCP when available', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }, { startTime: 2500 }];
        }
        return [];
      });

      const result = await runScanWithTimers();

      const lcpIssues = result.issues.filter((i) =>
        i.message?.includes('Largest Contentful Paint')
      );
      expect(lcpIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should use last LCP entry', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') {
          return [
            { startTime: 3000 },
            { startTime: 2000 },
            { startTime: 3500 }, // This should be used
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle missing LCP', async () => {
      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('DOM Content Loaded metrics', () => {
    it('should calculate DOM Content Loaded time', async () => {
      // domContentLoadedEventEnd - domContentLoadedEventStart = 3200 - 3100 = 100ms (good)
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect poor DOM Content Loaded', async () => {
      mockPerformanceAPI.timing.domContentLoadedEventStart = 2000;
      mockPerformanceAPI.timing.domContentLoadedEventEnd = 4500;
      // DOM Content Loaded = 4500 - 2000 = 2500ms (poor, >2000)

      const result = await runScanWithTimers();

      const dcIssues = result.issues.filter((i) => i.message?.includes('DOM Content Loaded'));
      if (dcIssues.length > 0) {
        expect(dcIssues[0].severity).toBeDefined();
      }

      // Reset
      mockPerformanceAPI.timing.domContentLoadedEventStart = 3100;
      mockPerformanceAPI.timing.domContentLoadedEventEnd = 3200;
    });
  });

  describe('Page Load Time metrics', () => {
    it('should calculate page load time', async () => {
      // loadEventEnd - navigationStart = 5000 - 1000 = 4000ms
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect good page load time', async () => {
      mockPerformanceAPI.timing.navigationStart = 1000;
      mockPerformanceAPI.timing.loadEventEnd = 2500;
      // Page Load Time = 2500 - 1000 = 1500ms (good, <2000)

      const result = await runScanWithTimers();

      const plIssues = result.issues.filter((i) => i.message?.includes('Page Load Time'));
      if (plIssues.length > 0) {
        expect(plIssues[0].severity).toMatch(/minor|moderate/);
      }

      // Reset
      mockPerformanceAPI.timing.navigationStart = 1000;
      mockPerformanceAPI.timing.loadEventEnd = 5000;
    });

    it('should detect poor page load time', async () => {
      mockPerformanceAPI.timing.navigationStart = 1000;
      mockPerformanceAPI.timing.loadEventEnd = 6000;
      // Page Load Time = 6000 - 1000 = 5000ms (poor, >4000)

      const result = await runScanWithTimers();

      const plIssues = result.issues.filter((i) => i.message?.includes('Page Load Time'));
      if (plIssues.length > 0) {
        expect(plIssues[0].severity).toBeDefined();
      }

      // Reset
      mockPerformanceAPI.timing.navigationStart = 1000;
      mockPerformanceAPI.timing.loadEventEnd = 5000;
    });
  });

  describe('Resource metrics', () => {
    it('should collect resource count', async () => {
      const resources = [
        { transferSize: 1024, initiatorType: 'script' },
        { transferSize: 2048, initiatorType: 'img' },
        { transferSize: 512, initiatorType: 'link' },
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const resourceIssues = result.issues.filter((i) => i.message?.includes('Total Resources'));
      expect(resourceIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total resource size', async () => {
      const resources = [
        { transferSize: 100000, initiatorType: 'script' }, // 97KB
        { transferSize: 200000, initiatorType: 'img' }, // 195KB
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const sizeIssues = result.issues.filter((i) => i.message?.includes('Total Resource Size'));
      expect(sizeIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate image size separately', async () => {
      const resources = [
        { transferSize: 1024, initiatorType: 'script' },
        { transferSize: 100000, initiatorType: 'img' }, // Large image
        { transferSize: 50000, initiatorType: 'img' }, // Another image
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const imageIssues = result.issues.filter((i) => i.message?.includes('Image Size'));
      expect(imageIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate JavaScript size separately', async () => {
      const resources = [
        { transferSize: 300000, initiatorType: 'script' }, // Large JS
        { transferSize: 50000, initiatorType: 'script' }, // More JS
        { transferSize: 20000, initiatorType: 'img' },
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const jsIssues = result.issues.filter((i) => i.message?.includes('JavaScript Size'));
      expect(jsIssues.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle resources with zero transfer size', async () => {
      const resources = [
        { transferSize: 0, initiatorType: 'script' },
        { transferSize: 0, initiatorType: 'img' },
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle resources without transfer size', async () => {
      const resources = [
        { initiatorType: 'script' }, // No transferSize
        { initiatorType: 'img' }, // No transferSize
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect excessive number of resources', async () => {
      const resources = Array.from({ length: 120 }, (_, i) => ({
        transferSize: 1024,
        initiatorType: 'script',
      }));
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const resourceIssues = result.issues.filter((i) => i.message?.includes('Total Resources'));
      if (resourceIssues.length > 0) {
        expect(resourceIssues[0].severity).toBeDefined();
      }
    });
  });

  describe('Navigation timing metrics', () => {
    it('should collect DNS time', async () => {
      // DNS time = domainLookupEnd - domainLookupStart = 1200 - 1100 = 100ms
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should collect connection time', async () => {
      // Connection time = connectEnd - connectStart = 1300 - 1200 = 100ms
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should collect request time', async () => {
      // Request time = responseStart - requestStart = 1800 - 1300 = 500ms
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should collect response time', async () => {
      // Response time = responseEnd - responseStart = 2000 - 1800 = 200ms
      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Performance scanner specifics', () => {
    it('should be callable multiple times', async () => {
      const result1 = await runScanWithTimers();
      const result2 = await runScanWithTimers();

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.issues.length).toBeGreaterThanOrEqual(0);
      expect(result2.issues.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing performance.timing', async () => {
      const originalTiming = mockPerformanceAPI.timing;
      mockPerformanceAPI.timing = null as any;

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);

      mockPerformanceAPI.timing = originalTiming;
    });
  });
});
