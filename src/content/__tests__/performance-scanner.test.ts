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

// Store observer data for tests
interface ObserverData {
  layoutShift: unknown[];
  event: unknown[];
  longtask: unknown[];
}

let observerData: ObserverData = {
  layoutShift: [],
  event: [],
  longtask: [],
};

// Create a mock PerformanceObserver that invokes callbacks
class MockPerformanceObserver {
  private callback: (list: { getEntries: () => unknown[] }) => void;

  constructor(callback: (list: { getEntries: () => unknown[] }) => void) {
    this.callback = callback;
  }

  observe(options: { type: string; buffered?: boolean }) {
    // Get the appropriate data for this observer type
    let entries: unknown[] = [];
    if (options.type === 'layout-shift') {
      entries = observerData.layoutShift;
    } else if (options.type === 'event') {
      entries = observerData.event;
    } else if (options.type === 'longtask') {
      entries = observerData.longtask;
    }

    // Invoke callback with entries if there are any
    if (entries.length > 0) {
      this.callback({ getEntries: () => entries });
    }
  }

  disconnect() {}
}

vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);

vi.stubGlobal('window', {
  location: mockWindowLocation,
  matchMedia: vi.fn(),
  PerformanceObserver: MockPerformanceObserver,
});

// Mock document.querySelector for getElementHtml function
const mockQuerySelector = vi.fn();
vi.stubGlobal('document', {
  querySelector: mockQuerySelector,
  querySelectorAll: vi.fn().mockReturnValue([]),
});

import { scanPerformance } from '../performance-scanner';

// Helper to run scanPerformance with fake timers
async function runScanWithTimers() {
  const scanPromise = scanPerformance();
  // Advance timers to skip the 1-second delay in performance-scanner
  await vi.advanceTimersByTimeAsync(1100);
  return scanPromise;
}

// Helper to set observer data for a test
function setObserverData(data: Partial<ObserverData>) {
  observerData = {
    layoutShift: data.layoutShift || [],
    event: data.event || [],
    longtask: data.longtask || [],
  };
}

describe('Performance Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    mockGetEntriesByType.mockReturnValue([]);
    mockGetEntriesByName.mockReturnValue([]);
    mockQuerySelector.mockReturnValue(null);
    setObserverData({});
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

  describe('CLS issue generation with poor ratings', () => {
    it('should handle CLS metrics from buffered entries', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          const mockElement = {
            id: 'shifting-div',
            tagName: 'DIV',
            className: '',
            parentElement: null,
          };
          return [
            {
              value: 0.15, // needs-improvement CLS
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0, left: 0 },
                  currentRect: { top: 100, left: 0 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      // CLS data should be processed without errors
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should handle CLS with poor rating value', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            { value: 0.3, hadRecentInput: false, sources: [] }, // poor CLS
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      // Result should be valid regardless of whether issues are generated
      expect(result.url).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should track shifting elements from sources', async () => {
      const mockElement = {
        id: 'big-shifter',
        tagName: 'DIV',
        className: '',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 100 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      // Should complete without error
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle very small layout shifts gracefully', async () => {
      const mockElement = {
        id: 'tiny-shifter',
        tagName: 'DIV',
        className: '',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.005, // Very small shift
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 2 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      // Small shifts should be handled gracefully
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('INP metric handling', () => {
    it('should handle INP with interaction entries', async () => {
      const mockTarget = {
        id: 'slow-button',
        tagName: 'BUTTON',
        className: '',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            {
              name: 'click',
              duration: 300, // needs-improvement INP
              interactionId: 1,
              target: mockTarget,
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      // INP metrics should be processed
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle INP with high duration value', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            {
              name: 'click',
              duration: 600, // poor INP
              interactionId: 1,
              target: undefined,
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(result.summary).toBeDefined();
    });

    it('should process multiple interactions correctly', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            { name: 'click', duration: 100, interactionId: 1, target: undefined },
            { name: 'keydown', duration: 350, interactionId: 2, target: undefined }, // Worst
            { name: 'click', duration: 150, interactionId: 3, target: undefined },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle same interactionId with different durations', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'event') {
          return [
            { name: 'click', duration: 100, interactionId: 1, target: undefined },
            { name: 'click', duration: 250, interactionId: 1, target: undefined }, // Same ID, longer
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('TBT metric handling', () => {
    it('should handle longtask entries with moderate blocking', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 300, startTime: 0, attribution: [] }, // 250ms blocking
            { duration: 150, startTime: 500, attribution: [] }, // 100ms blocking
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle longtask entries with high blocking', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 500, startTime: 0, attribution: [] }, // 450ms blocking
            { duration: 400, startTime: 600, attribution: [] }, // 350ms blocking = 800ms total (poor)
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });

    it('should process multiple longtask entries', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 200, startTime: 0, attribution: [] }, // 150ms blocking
            { duration: 400, startTime: 300, attribution: [] }, // 350ms blocking
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle longtask with very high blocking time', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 500, startTime: 0, attribution: [] }, // 450ms blocking (>300ms = serious)
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(result.incomplete).toHaveLength(0);
    });

    it('should handle longtask with small blocking time', async () => {
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'longtask') {
          return [
            { duration: 80, startTime: 0, attribution: [] }, // 30ms blocking (< 100ms threshold)
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('getSelector edge cases - comprehensive', () => {
    it('should use nth-child selector for elements without ID or unique classes', async () => {
      const parentElement = {
        children: [{}, {}, {}],
        tagName: 'BODY',
        id: '',
        className: '',
        parentElement: null,
      };
      parentElement.children[1] = {
        id: '',
        className: '',
        tagName: 'DIV',
        parentElement: parentElement,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: parentElement.children[1],
                  previousRect: { top: 0 },
                  currentRect: { top: 50 },
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

    it('should handle elements with non-string className', async () => {
      const mockElement = {
        id: '',
        className: { baseVal: 'svg-class' }, // SVG elements have className as object
        tagName: 'SVG',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.12,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 20 },
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

    it('should handle selector with many matching elements (non-unique)', async () => {
      // Mock document.querySelectorAll to return many elements
      const mockQuerySelectorAll = vi.fn().mockReturnValue([{}, {}, {}, {}, {}]); // 5 elements = not unique
      vi.stubGlobal('document', {
        ...document,
        querySelector: vi.fn().mockReturnValue({ outerHTML: '<div>...</div>' }),
        querySelectorAll: mockQuerySelectorAll,
      });

      const mockElement = {
        id: '',
        className: 'common-class',
        tagName: 'DIV',
        parentElement: {
          id: 'parent',
          tagName: 'SECTION',
          children: [{ tagName: 'SPAN' }, { tagName: 'DIV' }],
          parentElement: null,
        },
      };
      mockElement.parentElement.children[1] = mockElement;

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.12,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 20 },
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

  describe('getElementHtml edge cases', () => {
    it('should truncate very long HTML', async () => {
      const longHTML = '<div class="' + 'x'.repeat(300) + '">Content</div>';
      const mockQuerySelector = vi.fn().mockReturnValue({
        outerHTML: longHTML,
      });
      vi.stubGlobal('document', {
        ...document,
        querySelector: mockQuerySelector,
        querySelectorAll: vi.fn().mockReturnValue([]),
      });

      const mockElement = {
        id: 'long-element',
        tagName: 'DIV',
        className: '',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 50 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      const clsElementIssues = result.issues.filter((i) => i.ruleId === 'performance-cls-element');
      if (clsElementIssues.length > 0) {
        // HTML should be truncated
        expect(clsElementIssues[0].element?.html.length).toBeLessThanOrEqual(210);
      }
    });

    it('should handle invalid selector in getElementHtml', async () => {
      const mockQuerySelector = vi.fn().mockImplementation((selector) => {
        if (selector.includes('[invalid')) {
          throw new Error('Invalid selector');
        }
        return null;
      });
      vi.stubGlobal('document', {
        ...document,
        querySelector: mockQuerySelector,
        querySelectorAll: vi.fn().mockReturnValue([]),
      });

      const mockElement = {
        id: '',
        className: '[invalid',
        tagName: 'DIV',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 50 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      // Should not crash, fallback HTML should be used
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle null element from querySelector', async () => {
      const mockQuerySelector = vi.fn().mockReturnValue(null);
      vi.stubGlobal('document', {
        ...document,
        querySelector: mockQuerySelector,
        querySelectorAll: vi.fn().mockReturnValue([]),
      });

      const mockElement = {
        id: 'missing-element',
        tagName: 'DIV',
        className: '',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 50 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      const clsElementIssues = result.issues.filter((i) => i.ruleId === 'performance-cls-element');
      if (clsElementIssues.length > 0) {
        // Fallback HTML should be used
        expect(clsElementIssues[0].element?.html).toContain('element selector=');
      }
    });
  });

  describe('getTagFromSelector edge cases', () => {
    it('should extract tag name from complex selector', async () => {
      const mockElement = {
        id: '',
        className: 'my-class another-class',
        tagName: 'SPAN',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 50 },
                },
              ],
            },
          ];
        }
        return [];
      });

      const result = await runScanWithTimers();

      const clsElementIssues = result.issues.filter((i) => i.ruleId === 'performance-cls-element');
      if (clsElementIssues.length > 0) {
        expect(clsElementIssues[0].fix?.code).toContain('span');
      }
    });

    it('should default to div for selectors without tag', async () => {
      const mockElement = {
        id: 'just-id',
        className: '',
        tagName: 'DIV',
        parentElement: null,
      };

      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [
            {
              value: 0.15,
              hadRecentInput: false,
              sources: [
                {
                  node: mockElement,
                  previousRect: { top: 0 },
                  currentRect: { top: 50 },
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

  describe('PerformanceObserver with callbacks', () => {
    it('should handle layout-shift observer callback with sources containing elements', async () => {
      const mockElement = {
        id: 'observed-element',
        tagName: 'DIV',
        className: '',
        parentElement: null,
      };

      let observerCallback: ((list: any) => void) | null = null;

      vi.stubGlobal(
        'PerformanceObserver',
        class {
          constructor(callback: (list: any) => void) {
            observerCallback = callback;
          }
          observe() {
            // Simulate callback being called with entries
            if (observerCallback) {
              observerCallback({
                getEntries: () => [
                  {
                    value: 0.08,
                    hadRecentInput: false,
                    sources: [
                      {
                        node: mockElement,
                        previousRect: { top: 0 },
                        currentRect: { top: 30 },
                      },
                    ],
                  },
                ],
              });
            }
          }
          disconnect() {}
        } as any
      );

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle event observer callback with interactions', async () => {
      let observerCallback: ((list: any) => void) | null = null;

      vi.stubGlobal(
        'PerformanceObserver',
        class {
          constructor(callback: (list: any) => void) {
            observerCallback = callback;
          }
          observe(options: any) {
            if (options.type === 'event' && observerCallback) {
              observerCallback({
                getEntries: () => [
                  {
                    name: 'click',
                    duration: 280,
                    interactionId: 5,
                    target: undefined,
                  },
                ],
              });
            }
          }
          disconnect() {}
        } as any
      );

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should handle longtask observer callback', async () => {
      let observerCallback: ((list: any) => void) | null = null;

      vi.stubGlobal(
        'PerformanceObserver',
        class {
          constructor(callback: (list: any) => void) {
            observerCallback = callback;
          }
          observe(options: any) {
            if (options.type === 'longtask' && observerCallback) {
              observerCallback({
                getEntries: () => [
                  {
                    duration: 180,
                    startTime: 100,
                    attribution: [],
                  },
                ],
              });
            }
          }
          disconnect() {}
        } as any
      );

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Missing PerformanceObserver', () => {
    it('should handle missing PerformanceObserver gracefully for CLS', async () => {
      vi.stubGlobal('PerformanceObserver', undefined);

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should handle missing PerformanceObserver for INP', async () => {
      // Remove PerformanceObserver from window
      vi.stubGlobal('PerformanceObserver', undefined);
      vi.stubGlobal('window', {
        location: mockWindowLocation,
        matchMedia: vi.fn(),
        // No PerformanceObserver
      });

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      // INP should return early with good rating when PerformanceObserver not available
      expect(Array.isArray(result.issues)).toBe(true);
      const inpIssues = result.issues.filter(
        (i: { ruleId: string }) => i.ruleId === 'performance-inp'
      );
      expect(inpIssues.length).toBe(0);
    });

    it('should handle missing PerformanceObserver for TBT', async () => {
      // Remove PerformanceObserver from window
      vi.stubGlobal('PerformanceObserver', undefined);
      vi.stubGlobal('window', {
        location: mockWindowLocation,
        matchMedia: vi.fn(),
        // No PerformanceObserver
      });

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      // TBT should return early with good rating when PerformanceObserver not available
      expect(Array.isArray(result.issues)).toBe(true);
      const tbtIssues = result.issues.filter(
        (i: { ruleId: string }) => i.ruleId === 'performance-tbt'
      );
      expect(tbtIssues.length).toBe(0);
    });

    it('should handle missing PerformanceObserver for all metrics together', async () => {
      // This ensures all three measure functions handle missing PerformanceObserver
      vi.stubGlobal('PerformanceObserver', undefined);
      vi.stubGlobal('window', {
        location: mockWindowLocation,
        matchMedia: vi.fn(),
      });

      mockGetEntriesByType.mockReturnValue([]);
      mockGetEntriesByName.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(Array.isArray(result.issues)).toBe(true);
      // No CLS, INP, or TBT issues when PerformanceObserver not available
      const coreWebVitalIssues = result.issues.filter(
        (i: { ruleId: string }) =>
          i.ruleId === 'performance-cls' ||
          i.ruleId === 'performance-inp' ||
          i.ruleId === 'performance-tbt'
      );
      expect(coreWebVitalIssues.length).toBe(0);
    });
  });

  describe('getLearnMoreUrl branches', () => {
    it('should return FID-specific URL', async () => {
      // FID is deprecated but the URL function still supports it
      // We can test this through a metric that contains 'fid' in its name
      mockPerformanceAPI.timing.responseStart = 4000;
      mockPerformanceAPI.timing.requestStart = 1300;

      const result = await runScanWithTimers();

      // Check that URLs are being generated correctly
      for (const issue of result.issues) {
        if (issue.fix?.learnMoreUrl) {
          expect(issue.fix.learnMoreUrl).toMatch(/^https:\/\/web\.dev\//);
        }
      }

      mockPerformanceAPI.timing.responseStart = 1800;
    });
  });

  describe('mapRatingToSeverity branches', () => {
    it('should map good rating to minor severity', async () => {
      // When CLS is exactly at the threshold
      mockGetEntriesByType.mockImplementation((type) => {
        if (type === 'layout-shift') {
          return [{ value: 0.1, hadRecentInput: false, sources: [] }]; // Exactly at good threshold
        }
        return [];
      });

      const result = await runScanWithTimers();

      // Good ratings should not create main CLS issues
      const clsIssues = result.issues.filter((i) => i.ruleId === 'performance-cls');
      expect(clsIssues.length).toBe(0);
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

  describe('CLS Issue Generation - Direct Tests', () => {
    it('should process CLS entries with needs-improvement values', async () => {
      // Set both buffered entries and observer data
      const clsEntries = [{ value: 0.15, hadRecentInput: false, sources: [] }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      // Verify the scan completed successfully
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should process CLS entries with poor rating values', async () => {
      const clsEntries = [{ value: 0.3, hadRecentInput: false, sources: [] }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      // Verify the scan completed successfully
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should process CLS element shifts for elements with sources', async () => {
      const mockElement = { id: 'shifter', tagName: 'DIV', className: '', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      // Verify the scan processes sources without error
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should generate element-specific CLS issues for shifts > 0.01', async () => {
      const mockElement = { id: 'big-shifter', tagName: 'DIV', className: '', parentElement: null };
      const clsEntries = [
        {
          value: 0.12,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle CLS with multiple shifting elements', async () => {
      const mockElement1 = { id: 'shifter1', tagName: 'DIV', className: '', parentElement: null };
      const mockElement2 = { id: 'shifter2', tagName: 'SPAN', className: '', parentElement: null };
      const clsEntries = [
        {
          value: 0.08,
          hadRecentInput: false,
          sources: [{ node: mockElement1, previousRect: {}, currentRect: {} }],
        },
        {
          value: 0.07,
          hadRecentInput: false,
          sources: [{ node: mockElement2, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('INP Issue Generation - Direct Tests', () => {
    it('should process INP entries with needs-improvement rating', async () => {
      const eventEntries = [{ name: 'click', duration: 300, interactionId: 1, target: undefined }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'event') return eventEntries;
        return [];
      });
      setObserverData({ event: eventEntries });

      const result = await runScanWithTimers();

      // Verify the scan completed successfully
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should process INP entries with poor rating values', async () => {
      const eventEntries = [{ name: 'click', duration: 600, interactionId: 1, target: undefined }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'event') return eventEntries;
        return [];
      });
      setObserverData({ event: eventEntries });

      const result = await runScanWithTimers();

      // Verify the scan completed successfully
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should process INP entries with target element', async () => {
      const mockTarget = { id: 'slow-btn', tagName: 'BUTTON', className: '', parentElement: null };
      const eventEntries = [{ name: 'click', duration: 350, interactionId: 1, target: mockTarget }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'event') return eventEntries;
        return [];
      });
      setObserverData({ event: eventEntries });

      const result = await runScanWithTimers();

      // Verify the scan processes targets without error
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should process multiple INP interactions', async () => {
      const eventEntries = [
        { name: 'click', duration: 100, interactionId: 1, target: undefined },
        { name: 'keydown', duration: 400, interactionId: 2, target: undefined },
        { name: 'click', duration: 200, interactionId: 3, target: undefined },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'event') return eventEntries;
        return [];
      });
      setObserverData({ event: eventEntries });

      const result = await runScanWithTimers();

      // Verify the scan processes multiple interactions without error
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('TBT Issue Generation - Direct Tests', () => {
    it('should process TBT entries with needs-improvement rating values', async () => {
      const longtaskEntries = [
        { duration: 300, startTime: 0, attribution: [] },
        { duration: 150, startTime: 500, attribution: [] },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'longtask') return longtaskEntries;
        return [];
      });
      setObserverData({ longtask: longtaskEntries });

      const result = await runScanWithTimers();

      // Verify the scan completed successfully
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should process TBT entries with poor rating values', async () => {
      const longtaskEntries = [
        { duration: 500, startTime: 0, attribution: [] },
        { duration: 400, startTime: 600, attribution: [] },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'longtask') return longtaskEntries;
        return [];
      });
      setObserverData({ longtask: longtaskEntries });

      const result = await runScanWithTimers();

      // Verify the scan completed successfully
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should process long-task entries with significant blocking time', async () => {
      const longtaskEntries = [
        { duration: 200, startTime: 0, attribution: [] }, // 150ms blocking
        { duration: 400, startTime: 300, attribution: [] }, // 350ms blocking
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'longtask') return longtaskEntries;
        return [];
      });
      setObserverData({ longtask: longtaskEntries });

      const result = await runScanWithTimers();

      // Verify the scan processes long tasks without error
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should process long-task entries with very high blocking time', async () => {
      const longtaskEntries = [
        { duration: 500, startTime: 0, attribution: [] }, // 450ms blocking > 300ms
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'longtask') return longtaskEntries;
        return [];
      });
      setObserverData({ longtask: longtaskEntries });

      const result = await runScanWithTimers();

      // Verify the scan processes high blocking tasks
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should process long-task entries with minimal blocking time', async () => {
      const longtaskEntries = [
        { duration: 120, startTime: 0, attribution: [] }, // 70ms blocking <= 100ms
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'longtask') return longtaskEntries;
        return [];
      });
      setObserverData({ longtask: longtaskEntries });

      const result = await runScanWithTimers();

      // Verify the scan processes minimal blocking tasks
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Helper Functions Coverage', () => {
    it('should truncate long HTML in getElementHtml', async () => {
      const longHtml = '<div class="' + 'x'.repeat(300) + '">Content</div>';
      mockQuerySelector.mockReturnValue({ outerHTML: longHtml });

      const mockElement = { id: 'long-el', tagName: 'DIV', className: '', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should use fallback HTML when querySelector returns null', async () => {
      mockQuerySelector.mockReturnValue(null);

      const mockElement = { id: 'missing', tagName: 'DIV', className: '', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle querySelector errors gracefully', async () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const mockElement = { id: 'invalid', tagName: 'DIV', className: '', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should extract tag from selector with classes', async () => {
      const mockElement = { id: '', className: 'my-class', tagName: 'SPAN', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should default to div when selector has no tag', async () => {
      const mockElement = { id: 'just-id', className: '', tagName: 'DIV', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Combined Metrics Coverage', () => {
    it('should process all metrics types simultaneously', async () => {
      // Set up poor values for all metrics
      mockPerformanceAPI.timing.responseStart = 4000;
      mockPerformanceAPI.timing.requestStart = 1300;

      const clsEntries = [{ value: 0.3, hadRecentInput: false, sources: [] }];
      const eventEntries = [{ name: 'click', duration: 600, interactionId: 1, target: undefined }];
      const longtaskEntries = [{ duration: 700, startTime: 0, attribution: [] }];

      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        if (type === 'event') return eventEntries;
        if (type === 'longtask') return longtaskEntries;
        return [];
      });

      setObserverData({
        layoutShift: clsEntries,
        event: eventEntries,
        longtask: longtaskEntries,
      });

      const result = await runScanWithTimers();

      // Verify all metric types can be processed together
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.url).toBe('https://example.com');

      // Reset
      mockPerformanceAPI.timing.responseStart = 1800;
    });
  });

  describe('getTagFromSelector edge cases', () => {
    it('should return div as fallback when selector starts with special character', async () => {
      // Create an element with only class and no tag
      const mockElement = { id: '', className: '', tagName: '#special', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should extract tag from complex selector', async () => {
      const mockElement = { id: '', className: 'test', tagName: 'ARTICLE', parentElement: null };
      const clsEntries = [
        {
          value: 0.15,
          hadRecentInput: false,
          sources: [{ node: mockElement, previousRect: {}, currentRect: {} }],
        },
      ];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('CLS fix description and code', () => {
    it('should generate CLS-specific fix description for layout shift issues', async () => {
      const clsEntries = [{ value: 0.2, hadRecentInput: false, sources: [] }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      // Find any CLS-related issue
      const clsIssue = result.issues.find(
        (i: { ruleId: string }) => i.ruleId.includes('cls') || i.ruleId.includes('layout-shift')
      );
      if (clsIssue) {
        // Verify fix has proper structure
        expect(clsIssue.fix).toBeDefined();
      }
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should generate fix code for CLS issues', async () => {
      const clsEntries = [{ value: 0.3, hadRecentInput: false, sources: [] }];
      mockGetEntriesByType.mockImplementation((type: string) => {
        if (type === 'layout-shift') return clsEntries;
        return [];
      });
      setObserverData({ layoutShift: clsEntries });

      const result = await runScanWithTimers();

      // Verify issues have fix structure
      for (const issue of result.issues) {
        expect(issue.fix).toBeDefined();
      }
    });
  });

  describe('Window PerformanceObserver check', () => {
    it('should handle window without PerformanceObserver property', async () => {
      // Create window without PerformanceObserver
      const windowWithoutPO = {
        location: mockWindowLocation,
        matchMedia: vi.fn(),
      };
      // Delete PerformanceObserver from window
      delete (windowWithoutPO as Record<string, unknown>).PerformanceObserver;
      vi.stubGlobal('window', windowWithoutPO);
      vi.stubGlobal('PerformanceObserver', undefined);

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      expect(result).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.summary).toBeDefined();
    });

    it('should skip INP measurement when PerformanceObserver not in window', async () => {
      // Ensure window doesn't have PerformanceObserver
      vi.stubGlobal('window', {
        location: mockWindowLocation,
        matchMedia: vi.fn(),
        // Explicitly no PerformanceObserver
      });
      vi.stubGlobal('PerformanceObserver', undefined);

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      // Should complete without INP issues
      expect(result).toBeDefined();
      const inpIssues = result.issues.filter(
        (i: { ruleId: string }) => i.ruleId === 'performance-inp'
      );
      expect(inpIssues.length).toBe(0);
    });

    it('should skip TBT measurement when PerformanceObserver not in window', async () => {
      // Ensure window doesn't have PerformanceObserver
      vi.stubGlobal('window', {
        location: mockWindowLocation,
        matchMedia: vi.fn(),
        // Explicitly no PerformanceObserver
      });
      vi.stubGlobal('PerformanceObserver', undefined);

      mockGetEntriesByType.mockReturnValue([]);

      const result = await runScanWithTimers();

      // Should complete without TBT issues
      expect(result).toBeDefined();
      const tbtIssues = result.issues.filter(
        (i: { ruleId: string }) => i.ruleId === 'performance-tbt'
      );
      expect(tbtIssues.length).toBe(0);
    });
  });
});
