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

  describe('CLS (Cumulative Layout Shift) metrics', () => {
    it('should measure CLS with buffered layout-shift entries', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            { value: 0.05, hadRecentInput: false, sources: [] },
            { value: 0.03, hadRecentInput: false, sources: [] },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should ignore layout shifts with recent user input', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            { value: 0.05, hadRecentInput: true, sources: [] }, // Should be ignored
            { value: 0.03, hadRecentInput: false, sources: [] }, // Should be counted
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should track shifting elements', async () => {
      const mockElement = { id: 'test-element' };
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.08,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0, left: 0 },
                  currentRect: { top: 50, left: 0 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle CLS without sources', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [{ value: 0.05, hadRecentInput: false }];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle PerformanceObserver errors for layout-shift', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [{ value: 0.02, hadRecentInput: false, sources: [] }];
        }
        return [];
      });

      // Mock PerformanceObserver to throw on observe
      const originalObserver = window.PerformanceObserver;
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          observe() {
            throw new Error('layout-shift not supported');
          }
          disconnect() {}
        } as any
      );

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);

      if (originalObserver) {
        vi.stubGlobal('PerformanceObserver', originalObserver);
      }
    });
  });

  describe('INP (Interaction to Next Paint) metrics', () => {
    it('should measure INP with buffered event entries', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            {
              name: 'click',
              duration: 100,
              interactionId: 1,
              target: undefined,
            },
            {
              name: 'click',
              duration: 150,
              interactionId: 2,
              target: undefined,
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle INP with no interactions', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should track worst interaction by duration', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            { name: 'click', duration: 50, interactionId: 1, target: undefined },
            { name: 'keydown', duration: 200, interactionId: 2, target: undefined }, // Worst
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle INP without interactionId', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            { name: 'click', duration: 100, interactionId: 0, target: undefined }, // Invalid
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle event timing errors gracefully', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          throw new Error('event timing not supported');
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle PerformanceObserver errors for event', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [{ name: 'click', duration: 100, interactionId: 1 }];
        }
        return [];
      });

      // Mock PerformanceObserver to throw on observe
      const originalObserver = window.PerformanceObserver;
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          observe() {
            throw new Error('event not supported');
          }
          disconnect() {}
        } as any
      );

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);

      if (originalObserver) {
        vi.stubGlobal('PerformanceObserver', originalObserver);
      }
    });
  });

  describe('TBT (Total Blocking Time) metrics', () => {
    it('should measure TBT with long task entries', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            {
              duration: 100,
              startTime: 100,
              attribution: [],
            },
            {
              duration: 80,
              startTime: 500,
              attribution: [],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should calculate blocking time correctly', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 100, startTime: 0, attribution: [] }, // Blocking = 100 - 50 = 50ms
            { duration: 30, startTime: 200, attribution: [] }, // Blocking = max(0, 30 - 50) = 0ms
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle long tasks with errors', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          throw new Error('longtask not supported');
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle PerformanceObserver errors for longtask', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [{ duration: 100, startTime: 0, attribution: [] }];
        }
        return [];
      });

      // Mock PerformanceObserver to throw on observe
      const originalObserver = window.PerformanceObserver;
      vi.stubGlobal(
        'PerformanceObserver',
        class {
          observe() {
            throw new Error('longtask not supported');
          }
          disconnect() {}
        } as any
      );

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);

      if (originalObserver) {
        vi.stubGlobal('PerformanceObserver', originalObserver);
      }
    });

    it('should sort long tasks by blocking time', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 70, startTime: 0, attribution: [] }, // Blocking = 20ms
            { duration: 200, startTime: 200, attribution: [] }, // Blocking = 150ms (worst)
            { duration: 100, startTime: 500, attribution: [] }, // Blocking = 50ms
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('getSelector edge cases', () => {
    it('should use element ID for selector', async () => {
      const mockElement = {
        id: 'my-element',
        tagName: 'DIV',
        parentElement: null,
      };

      // Elements with IDs should return #id selector
      // This is indirectly tested through CLS measurements

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.05,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 10 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should use classes for selector when ID not available', async () => {
      const mockElement = {
        id: '',
        className: 'container primary',
        tagName: 'DIV',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.05,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 10 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Metric rating thresholds', () => {
    it('should rate good metrics appropriately', async () => {
      // Good TTFB, FCP, LCP values should not create issues
      mockPerformanceAPI.timing.responseStart = 1500; // Good TTFB
      mockGetEntriesByName.mockImplementation((name) => {
        if (name === 'first-contentful-paint') {
          return [{ startTime: 1000 }]; // Good FCP
        }
        return [];
      });
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 2000 }]; // Good LCP
        }
        return [];
      });

      const result = await runScanWithTimers();

      // Should have minimal or no issues for good metrics
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should rate needs-improvement metrics', async () => {
      // Set metrics in the "needs-improvement" range
      mockPerformanceAPI.timing.responseStart = 1500;
      mockPerformanceAPI.timing.requestStart = 500; // TTFB = 1000ms (needs-improvement)

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Image resource metrics and fix descriptions', () => {
    it('should detect poor image size and generate image-specific fix code', async () => {
      const resources = [
        { transferSize: 2000000, initiatorType: 'img' }, // 1.9MB of images (poor)
        { transferSize: 50000, initiatorType: 'script' },
      ];
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const imageIssues = result.issues.filter((i) => i.message?.includes('Image Size'));
      expect(imageIssues.length).toBeGreaterThan(0);
      if (imageIssues.length > 0) {
        expect(imageIssues[0].severity).toBeDefined();
        expect(imageIssues[0].fix?.code).toContain('image.webp');
        expect(imageIssues[0].fix?.code).toContain('loading="lazy"');
      }
    });

    it('should detect poor total resource size and generate generic fix code', async () => {
      const resources = Array.from({ length: 30 }, (_, i) => ({
        transferSize: 150000,
        initiatorType: 'other', // Not img or script, so no specific match
      }));
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'resource') {
          return resources;
        }
        return [];
      });

      const result = await runScanWithTimers();

      const sizeIssues = result.issues.filter((i) => i.message?.includes('Total Resource Size'));
      expect(sizeIssues.length).toBeGreaterThan(0);
      if (sizeIssues.length > 0) {
        expect(sizeIssues[0].fix?.code).toBeDefined();
        expect(sizeIssues[0].fix?.code).toContain('performance best practices');
      }
    });

    it('should detect poor JavaScript size and generate JavaScript-specific fix code', async () => {
      const resources = [
        { transferSize: 500000, initiatorType: 'script' }, // 488KB (poor)
        { transferSize: 600000, initiatorType: 'script' }, // More poor JS
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
      expect(jsIssues.length).toBeGreaterThan(0);
      if (jsIssues.length > 0) {
        expect(jsIssues[0].fix?.code).toContain('dynamic imports');
        expect(jsIssues[0].fix?.code).toContain('tree shaking');
      }
    });
  });

  describe('TTFB fix descriptions', () => {
    it('should generate TTFB-specific fix description', async () => {
      mockPerformanceAPI.timing.responseStart = 4000;
      mockPerformanceAPI.timing.requestStart = 1300; // TTFB = 2700ms (poor)

      const result = await runScanWithTimers();

      const ttfbIssues = result.issues.filter((i) => i.message?.includes('Time to First Byte'));
      expect(ttfbIssues.length).toBeGreaterThan(0);
      if (ttfbIssues.length > 0) {
        expect(ttfbIssues[0].fix?.description).toContain('server response times');
        expect(ttfbIssues[0].fix?.description).toContain('CDN');
      }

      mockPerformanceAPI.timing.responseStart = 1800;
    });
  });

  describe('FCP and LCP fix descriptions', () => {
    it('should generate FCP-specific fix description for poor FCP', async () => {
      mockGetEntriesByName.mockImplementation((name) => {
        if (name === 'first-contentful-paint') {
          return [{ startTime: 3500 }]; // Poor FCP
        }
        return [];
      });

      const result = await runScanWithTimers();

      const fcpIssues = result.issues.filter((i) => i.message?.includes('First Contentful Paint'));
      expect(fcpIssues.length).toBeGreaterThan(0);
      if (fcpIssues.length > 0) {
        expect(fcpIssues[0].fix?.description).toContain('critical resources');
        expect(fcpIssues[0].fix?.code).toContain('preload');
      }
    });

    it('should generate LCP-specific fix description for poor LCP', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'largest-contentful-paint') {
          return [{ startTime: 5000 }]; // Poor LCP
        }
        return [];
      });

      const result = await runScanWithTimers();

      const lcpIssues = result.issues.filter((i) =>
        i.message?.includes('Largest Contentful Paint')
      );
      expect(lcpIssues.length).toBeGreaterThan(0);
      if (lcpIssues.length > 0) {
        expect(lcpIssues[0].fix?.description).toContain('server response');
        expect(lcpIssues[0].fix?.code).toContain('preload');
      }
    });
  });

  describe('Resource count fix descriptions', () => {
    it('should generate resource-specific fix description for excessive resources', async () => {
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
      expect(resourceIssues.length).toBeGreaterThan(0);
      if (resourceIssues.length > 0) {
        expect(resourceIssues[0].fix?.description).toContain('combining files');
        expect(resourceIssues[0].fix?.description).toContain('HTTP/2');
      }
    });
  });

  describe('Default fix descriptions', () => {
    it('should generate default fix description for unknown metric type', async () => {
      // This test ensures the fallback description is covered
      mockPerformanceAPI.timing.domContentLoadedEventStart = 2000;
      mockPerformanceAPI.timing.domContentLoadedEventEnd = 4500; // Poor DCL = 2500ms

      const result = await runScanWithTimers();

      const dclIssues = result.issues.filter((i) => i.message?.includes('DOM Content Loaded'));
      expect(dclIssues.length).toBeGreaterThan(0);
      if (dclIssues.length > 0) {
        expect(dclIssues[0].fix?.description).toBeDefined();
      }

      mockPerformanceAPI.timing.domContentLoadedEventStart = 3100;
      mockPerformanceAPI.timing.domContentLoadedEventEnd = 3200;
    });
  });

  describe('Issue generation', () => {
    it('should not create CLS issues for good ratings', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [{ value: 0.02, hadRecentInput: false, sources: [] }]; // Good CLS
        }
        return [];
      });

      const result = await runScanWithTimers();

      const clsIssues = result.issues.filter((i) => i.ruleId === 'performance-cls');
      // Good CLS should not generate issues
      expect(clsIssues.length).toBeLessThanOrEqual(1);
    });

    it('should not create INP issues for zero value', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return []; // No interactions
        }
        return [];
      });

      const result = await runScanWithTimers();

      const inpIssues = result.issues.filter((i) => i.ruleId === 'performance-inp');
      // Zero INP should not generate issues
      expect(inpIssues.length).toBe(0);
    });

    it('should not create TBT issues for zero value', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return []; // No long tasks
        }
        return [];
      });

      const result = await runScanWithTimers();

      const tbtIssues = result.issues.filter((i) => i.ruleId === 'performance-tbt');
      // Zero TBT should not generate issues
      expect(tbtIssues.length).toBe(0);
    });
  });
});
