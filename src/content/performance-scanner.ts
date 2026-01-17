import type {
  Issue,
  ScanResult,
  ScanSummary,
  Severity,
  Category,
  WCAGCriteria,
} from '@/shared/types';

let idCounter = 0;

function generateId(): string {
  return `perf-issue-${Date.now()}-${++idCounter}`;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  unit: string;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Node;
    previousRect: DOMRectReadOnly;
    currentRect: DOMRectReadOnly;
  }>;
}

interface CLSResult {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  shiftingElements: Array<{
    selector: string;
    shift: number;
  }>;
}

interface INPResult {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  worstInteraction: {
    type: string;
    target: string;
    duration: number;
  } | null;
}

interface TBTResult {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  longTasks: Array<{
    duration: number;
    blockingTime: number;
    startTime: number;
  }>;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  interactionId: number;
  target?: Element;
}

interface LongTaskEntry extends PerformanceEntry {
  attribution: Array<{
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
    containerType: string;
    containerSrc: string;
    containerId: string;
    containerName: string;
  }>;
}

// Helper function to get a CSS selector for an element
function getSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).slice(0, 2).join('.');
    if (classes) {
      const selector = `${element.tagName.toLowerCase()}.${classes}`;
      // Verify selector is unique enough
      if (document.querySelectorAll(selector).length <= 3) {
        return selector;
      }
    }
  }

  // Fallback to tag with nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    const tagName = element.tagName.toLowerCase();
    return `${getSelector(parent)} > ${tagName}:nth-child(${index})`;
  }

  return element.tagName.toLowerCase();
}

// Measure Cumulative Layout Shift (CLS)
async function measureCLS(): Promise<CLSResult> {
  return new Promise((resolve) => {
    let clsValue = 0;
    const shiftingElements: Map<string, number> = new Map();

    // Check if PerformanceObserver supports layout-shift
    if (!('PerformanceObserver' in window)) {
      resolve({
        value: 0,
        rating: 'good',
        shiftingElements: [],
      });
      return;
    }

    // First, check for buffered layout-shift entries
    const bufferedEntries = performance.getEntriesByType('layout-shift') as LayoutShiftEntry[];

    for (const entry of bufferedEntries) {
      // Only count shifts without recent user input
      if (!entry.hadRecentInput) {
        clsValue += entry.value;

        // Track which elements are causing shifts
        if (entry.sources) {
          for (const source of entry.sources) {
            if (source.node && source.node instanceof Element) {
              const selector = getSelector(source.node);
              const currentShift = shiftingElements.get(selector) || 0;
              shiftingElements.set(selector, currentShift + entry.value);
            }
          }
        }
      }
    }

    // Also observe for any new shifts during measurement period
    let observer: PerformanceObserver | null = null;

    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShiftEntry[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;

            if (entry.sources) {
              for (const source of entry.sources) {
                if (source.node && source.node instanceof Element) {
                  const selector = getSelector(source.node);
                  const currentShift = shiftingElements.get(selector) || 0;
                  shiftingElements.set(selector, currentShift + entry.value);
                }
              }
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // layout-shift not supported
    }

    // Wait for a short period to capture any additional shifts
    setTimeout(() => {
      if (observer) {
        observer.disconnect();
      }

      // Convert map to array and sort by shift value
      const shiftingElementsArray = Array.from(shiftingElements.entries())
        .map(([selector, shift]) => ({ selector, shift }))
        .sort((a, b) => b.shift - a.shift)
        .slice(0, 5); // Top 5 shifting elements

      resolve({
        value: clsValue,
        rating: getRating(clsValue, THRESHOLDS.CLS),
        shiftingElements: shiftingElementsArray,
      });
    }, 500); // Wait 500ms for additional shifts
  });
}

// Measure Interaction to Next Paint (INP)
async function measureINP(): Promise<INPResult> {
  return new Promise((resolve) => {
    const interactions: Map<number, { duration: number; type: string; target: string }> = new Map();

    // Check if PerformanceObserver supports event timing
    if (!('PerformanceObserver' in window)) {
      resolve({
        value: 0,
        rating: 'good',
        worstInteraction: null,
      });
      return;
    }

    // Get buffered event timing entries
    try {
      const entries = performance.getEntriesByType('event') as PerformanceEventTiming[];

      for (const entry of entries) {
        if (entry.interactionId && entry.interactionId > 0) {
          const duration = entry.duration;
          const existing = interactions.get(entry.interactionId);

          if (!existing || duration > existing.duration) {
            interactions.set(entry.interactionId, {
              duration,
              type: entry.name,
              target: entry.target ? getSelector(entry.target) : 'unknown',
            });
          }
        }
      }
    } catch {
      // event timing not supported
    }

    // Also observe for new interactions
    let observer: PerformanceObserver | null = null;

    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEventTiming[]) {
          if (entry.interactionId && entry.interactionId > 0) {
            const duration = entry.duration;
            const existing = interactions.get(entry.interactionId);

            if (!existing || duration > existing.duration) {
              interactions.set(entry.interactionId, {
                duration,
                type: entry.name,
                target: entry.target ? getSelector(entry.target) : 'unknown',
              });
            }
          }
        }
      });

      observer.observe({ type: 'event', buffered: true });
    } catch {
      // event timing not supported
    }

    // Wait for measurement period
    setTimeout(() => {
      if (observer) {
        observer.disconnect();
      }

      // Calculate INP (98th percentile of interactions)
      const durations = Array.from(interactions.values())
        .map((i) => i.duration)
        .sort((a, b) => b - a);

      let inpValue = 0;
      let worstInteraction: INPResult['worstInteraction'] = null;

      if (durations.length > 0) {
        // Use the worst interaction for simplicity (approximation of p98)
        const worstIdx = Math.min(Math.floor(durations.length * 0.02), durations.length - 1);
        inpValue = durations[worstIdx] || durations[0];

        // Find the worst interaction details
        const worst = Array.from(interactions.values()).find((i) => i.duration === inpValue);
        if (worst) {
          worstInteraction = {
            type: worst.type,
            target: worst.target,
            duration: worst.duration,
          };
        }
      }

      resolve({
        value: inpValue,
        rating: getRating(inpValue, THRESHOLDS.INP),
        worstInteraction,
      });
    }, 500);
  });
}

// Measure Total Blocking Time (TBT)
async function measureTBT(): Promise<TBTResult> {
  return new Promise((resolve) => {
    const longTasks: TBTResult['longTasks'] = [];
    let totalBlockingTime = 0;

    // Check if PerformanceObserver is available
    if (!('PerformanceObserver' in window)) {
      resolve({
        value: 0,
        rating: 'good',
        longTasks: [],
      });
      return;
    }

    // Get buffered long task entries
    try {
      const entries = performance.getEntriesByType('longtask') as LongTaskEntry[];

      for (const entry of entries) {
        const blockingTime = Math.max(0, entry.duration - 50); // Blocking = duration - 50ms
        totalBlockingTime += blockingTime;

        longTasks.push({
          duration: entry.duration,
          blockingTime,
          startTime: entry.startTime,
        });
      }
    } catch {
      // longtask not supported
    }

    // Also observe for new long tasks
    let observer: PerformanceObserver | null = null;

    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LongTaskEntry[]) {
          const blockingTime = Math.max(0, entry.duration - 50);
          totalBlockingTime += blockingTime;

          longTasks.push({
            duration: entry.duration,
            blockingTime,
            startTime: entry.startTime,
          });
        }
      });

      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // longtask not supported
    }

    // Wait for measurement period
    setTimeout(() => {
      if (observer) {
        observer.disconnect();
      }

      // Sort by blocking time (worst first)
      longTasks.sort((a, b) => b.blockingTime - a.blockingTime);

      resolve({
        value: totalBlockingTime,
        rating: getRating(totalBlockingTime, THRESHOLDS.TBT),
        longTasks: longTasks.slice(0, 5), // Top 5 worst long tasks
      });
    }, 500);
  });
}

// Core Web Vitals thresholds (from Google)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 }, // First Input Delay (ms) - deprecated, replaced by INP
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TBT: { good: 200, poor: 600 }, // Total Blocking Time (ms)
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
  TTI: { good: 3800, poor: 7300 }, // Time to Interactive (ms)
};

function getRating(
  value: number,
  threshold: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function mapRatingToSeverity(rating: 'good' | 'needs-improvement' | 'poor'): Severity {
  switch (rating) {
    case 'good':
      return 'minor';
    case 'needs-improvement':
      return 'moderate';
    case 'poor':
      return 'serious';
  }
}

// Get performance metrics using Navigation Timing API
function getNavigationMetrics(): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];

  if (!performance || !performance.timing) {
    return metrics;
  }

  const timing = performance.timing;

  // Time to First Byte (TTFB)
  const ttfb = timing.responseStart - timing.requestStart;
  if (ttfb > 0) {
    metrics.push({
      name: 'TTFB (Time to First Byte)',
      value: ttfb,
      rating: getRating(ttfb, THRESHOLDS.TTFB),
      threshold: THRESHOLDS.TTFB,
      unit: 'ms',
    });
  }

  // First Contentful Paint
  const fcpEntries = performance.getEntriesByName('first-contentful-paint');
  if (fcpEntries.length > 0) {
    const fcp = fcpEntries[0].startTime;
    metrics.push({
      name: 'FCP (First Contentful Paint)',
      value: fcp,
      rating: getRating(fcp, THRESHOLDS.FCP),
      threshold: THRESHOLDS.FCP,
      unit: 'ms',
    });
  }

  // Largest Contentful Paint
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length > 0) {
    const lcp = lcpEntries[lcpEntries.length - 1].startTime;
    metrics.push({
      name: 'LCP (Largest Contentful Paint)',
      value: lcp,
      rating: getRating(lcp, THRESHOLDS.LCP),
      threshold: THRESHOLDS.LCP,
      unit: 'ms',
    });
  }

  // DOM Content Loaded
  const domContentLoaded = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
  if (domContentLoaded > 0) {
    metrics.push({
      name: 'DOM Content Loaded',
      value: domContentLoaded,
      rating:
        domContentLoaded < 1000 ? 'good' : domContentLoaded < 2000 ? 'needs-improvement' : 'poor',
      threshold: { good: 1000, poor: 2000 },
      unit: 'ms',
    });
  }

  // Page Load Time
  const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
  if (pageLoadTime > 0) {
    metrics.push({
      name: 'Page Load Time',
      value: pageLoadTime,
      rating: pageLoadTime < 2000 ? 'good' : pageLoadTime < 4000 ? 'needs-improvement' : 'poor',
      threshold: { good: 2000, poor: 4000 },
      unit: 'ms',
    });
  }

  return metrics;
}

// Get resource performance metrics
function getResourceMetrics(): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = [];

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  // Calculate total resource size (if available)
  let totalSize = 0;
  let imageSize = 0;
  let scriptSize = 0;

  for (const resource of resources) {
    const size = resource.transferSize || 0;
    totalSize += size;

    if (resource.initiatorType === 'img') {
      imageSize += size;
    } else if (resource.initiatorType === 'script') {
      scriptSize += size;
    }
  }

  // Total resources count
  metrics.push({
    name: 'Total Resources',
    value: resources.length,
    rating: resources.length < 50 ? 'good' : resources.length < 100 ? 'needs-improvement' : 'poor',
    threshold: { good: 50, poor: 100 },
    unit: 'resources',
  });

  // Resource size metrics (in KB)
  if (totalSize > 0) {
    const totalKB = totalSize / 1024;
    metrics.push({
      name: 'Total Resource Size',
      value: totalKB,
      rating: totalKB < 1000 ? 'good' : totalKB < 3000 ? 'needs-improvement' : 'poor',
      threshold: { good: 1000, poor: 3000 },
      unit: 'KB',
    });
  }

  if (imageSize > 0) {
    const imageKB = imageSize / 1024;
    metrics.push({
      name: 'Image Size',
      value: imageKB,
      rating: imageKB < 500 ? 'good' : imageKB < 1500 ? 'needs-improvement' : 'poor',
      threshold: { good: 500, poor: 1500 },
      unit: 'KB',
    });
  }

  if (scriptSize > 0) {
    const scriptKB = scriptSize / 1024;
    metrics.push({
      name: 'JavaScript Size',
      value: scriptKB,
      rating: scriptKB < 300 ? 'good' : scriptKB < 900 ? 'needs-improvement' : 'poor',
      threshold: { good: 300, poor: 900 },
      unit: 'KB',
    });
  }

  return metrics;
}

// Convert CLS result to issues
function clsToIssues(clsResult: CLSResult): Issue[] {
  const issues: Issue[] = [];

  // Only create an issue if CLS is not good
  if (clsResult.rating === 'good') {
    return issues;
  }

  const severity = mapRatingToSeverity(clsResult.rating);
  const valueFormatted = clsResult.value.toFixed(3);

  // Main CLS issue
  const mainIssue: Issue = {
    id: generateId(),
    ruleId: 'performance-cls',
    severity,
    category: 'technical' as Category,
    message: `CLS (Cumulative Layout Shift): ${valueFormatted}`,
    description: `Cumulative Layout Shift measures visual stability. Your score of ${valueFormatted} is rated as "${clsResult.rating}". Good: ≤0.1, Needs improvement: ≤0.25, Poor: >0.25`,
    helpUrl: 'https://web.dev/cls/',
    wcag: {
      id: 'Performance',
      level: 'AA',
      name: 'Visual Stability',
      description: 'Cumulative Layout Shift - measures unexpected layout shifts',
    } as WCAGCriteria,
    element: {
      selector: 'body',
      html: '<body>...</body>',
      failureSummary: `CLS is ${valueFormatted}, which indicates ${clsResult.rating === 'poor' ? 'poor' : 'moderate'} visual stability`,
    },
    fix: {
      description:
        'Reduce Cumulative Layout Shift by adding explicit dimensions to images/videos, avoiding inserting content above existing content, and using transform animations instead of properties that trigger layout.',
      code: `<!-- Always include width and height on images -->
<img src="image.jpg" width="800" height="600" alt="...">

<!-- Reserve space for dynamic content -->
<div style="min-height: 200px;">
  <!-- Dynamic content loads here -->
</div>

<!-- Use CSS aspect-ratio for responsive images -->
<img src="image.jpg" style="aspect-ratio: 16/9; width: 100%;">`,
      learnMoreUrl: 'https://web.dev/cls/',
    },
  };

  issues.push(mainIssue);

  // Create individual issues for each shifting element
  for (const shiftingElement of clsResult.shiftingElements) {
    if (shiftingElement.shift > 0.01) {
      // Only report significant shifts
      issues.push({
        id: generateId(),
        ruleId: 'performance-cls-element',
        severity: shiftingElement.shift > 0.1 ? 'serious' : 'moderate',
        category: 'technical' as Category,
        message: `Layout shift detected: ${shiftingElement.shift.toFixed(3)}`,
        description: `This element contributed ${shiftingElement.shift.toFixed(3)} to the total CLS score. Consider adding explicit dimensions or reserving space for this element.`,
        helpUrl: 'https://web.dev/cls/',
        wcag: {
          id: 'Performance',
          level: 'AA',
          name: 'Visual Stability',
          description: 'Element causing layout shift',
        } as WCAGCriteria,
        element: {
          selector: shiftingElement.selector,
          html: getElementHtml(shiftingElement.selector),
          failureSummary: `This element shifted by ${shiftingElement.shift.toFixed(3)}`,
        },
        fix: {
          description:
            'Add explicit width and height attributes, use CSS aspect-ratio, or reserve space for this element to prevent layout shifts.',
          code: `<!-- Add explicit dimensions -->
<${getTagFromSelector(shiftingElement.selector)} width="..." height="...">

<!-- Or use CSS -->
.element {
  aspect-ratio: 16/9;
  width: 100%;
}`,
          learnMoreUrl: 'https://web.dev/optimize-cls/',
        },
      });
    }
  }

  return issues;
}

// Helper to get element HTML from selector
function getElementHtml(selector: string): string {
  try {
    const element = document.querySelector(selector);
    if (element) {
      const html = element.outerHTML;
      // Truncate if too long
      if (html.length > 200) {
        return html.substring(0, 200) + '...>';
      }
      return html;
    }
  } catch {
    // Invalid selector
  }
  return `<element selector="${selector}">...</element>`;
}

// Helper to extract tag name from selector
function getTagFromSelector(selector: string): string {
  const match = selector.match(/^([a-z0-9]+)/i);
  return match ? match[1] : 'div';
}

// Convert INP result to issues
function inpToIssues(inpResult: INPResult): Issue[] {
  const issues: Issue[] = [];

  // Only create an issue if INP is not good
  if (inpResult.rating === 'good' || inpResult.value === 0) {
    return issues;
  }

  const severity = mapRatingToSeverity(inpResult.rating);
  const valueFormatted = Math.round(inpResult.value);

  const mainIssue: Issue = {
    id: generateId(),
    ruleId: 'performance-inp',
    severity,
    category: 'technical' as Category,
    message: `INP (Interaction to Next Paint): ${valueFormatted}ms`,
    description: `Interaction to Next Paint measures responsiveness. Your score of ${valueFormatted}ms is rated as "${inpResult.rating}". Good: ≤200ms, Needs improvement: ≤500ms, Poor: >500ms`,
    helpUrl: 'https://web.dev/inp/',
    wcag: {
      id: 'Performance',
      level: 'AA',
      name: 'Responsiveness',
      description: 'Interaction to Next Paint - measures input responsiveness',
    } as WCAGCriteria,
    element: {
      selector: inpResult.worstInteraction?.target || 'body',
      html: inpResult.worstInteraction
        ? getElementHtml(inpResult.worstInteraction.target)
        : '<body>...</body>',
      failureSummary: inpResult.worstInteraction
        ? `Slowest interaction: ${inpResult.worstInteraction.type} on ${inpResult.worstInteraction.target} took ${Math.round(inpResult.worstInteraction.duration)}ms`
        : `INP is ${valueFormatted}ms, indicating slow response to user interactions`,
    },
    fix: {
      description:
        'Improve INP by breaking up long tasks, optimizing event handlers, reducing JavaScript execution time, and using web workers for heavy computations.',
      code: `// Break up long tasks with scheduler.yield()
async function handleClick() {
  doFirstPart();
  await scheduler.yield(); // Let browser update
  doSecondPart();
}

// Or use setTimeout to break up work
function processLargeArray(items) {
  const chunk = items.splice(0, 100);
  processChunk(chunk);
  if (items.length > 0) {
    setTimeout(() => processLargeArray(items), 0);
  }
}

// Debounce rapid interactions
const debouncedHandler = debounce(handler, 100);`,
      learnMoreUrl: 'https://web.dev/optimize-inp/',
    },
  };

  issues.push(mainIssue);

  return issues;
}

// Convert TBT result to issues
function tbtToIssues(tbtResult: TBTResult): Issue[] {
  const issues: Issue[] = [];

  // Only create an issue if TBT is not good
  if (tbtResult.rating === 'good' || tbtResult.value === 0) {
    return issues;
  }

  const severity = mapRatingToSeverity(tbtResult.rating);
  const valueFormatted = Math.round(tbtResult.value);

  const mainIssue: Issue = {
    id: generateId(),
    ruleId: 'performance-tbt',
    severity,
    category: 'technical' as Category,
    message: `TBT (Total Blocking Time): ${valueFormatted}ms`,
    description: `Total Blocking Time measures how long the main thread was blocked. Your score of ${valueFormatted}ms is rated as "${tbtResult.rating}". Good: ≤200ms, Needs improvement: ≤600ms, Poor: >600ms`,
    helpUrl: 'https://web.dev/tbt/',
    wcag: {
      id: 'Performance',
      level: 'AA',
      name: 'Main Thread',
      description: 'Total Blocking Time - measures main thread blocking',
    } as WCAGCriteria,
    element: {
      selector: 'body',
      html: '<body>...</body>',
      failureSummary: `${tbtResult.longTasks.length} long task(s) blocked the main thread for a total of ${valueFormatted}ms`,
    },
    fix: {
      description:
        'Reduce TBT by breaking up long JavaScript tasks, removing unused JavaScript, minimizing main thread work, and deferring non-critical scripts.',
      code: `<!-- Defer non-critical scripts -->
<script src="analytics.js" defer></script>

<!-- Use async for independent scripts -->
<script src="widget.js" async></script>

// Code split with dynamic imports
const module = await import('./heavy-module.js');

// Move heavy work to Web Worker
const worker = new Worker('worker.js');
worker.postMessage(largeData);`,
      learnMoreUrl: 'https://web.dev/optimize-tbt/',
    },
  };

  issues.push(mainIssue);

  // Add issues for individual long tasks if significant
  for (const task of tbtResult.longTasks) {
    if (task.blockingTime > 100) {
      // Only report significant blocking
      issues.push({
        id: generateId(),
        ruleId: 'performance-long-task',
        severity: task.blockingTime > 300 ? 'serious' : 'moderate',
        category: 'technical' as Category,
        message: `Long task detected: ${Math.round(task.duration)}ms (${Math.round(task.blockingTime)}ms blocking)`,
        description: `A task running for ${Math.round(task.duration)}ms blocked the main thread for ${Math.round(task.blockingTime)}ms. Tasks over 50ms are considered long tasks.`,
        helpUrl: 'https://web.dev/long-tasks-devtools/',
        wcag: {
          id: 'Performance',
          level: 'AA',
          name: 'Long Task',
          description: 'JavaScript task that blocked the main thread',
        } as WCAGCriteria,
        element: {
          selector: 'body',
          html: '<script>...</script>',
          failureSummary: `Long task at ${Math.round(task.startTime)}ms blocked for ${Math.round(task.blockingTime)}ms`,
        },
        fix: {
          description:
            'Break up this long task into smaller chunks using requestIdleCallback, setTimeout, or scheduler.yield().',
          code: `// Use requestIdleCallback for non-urgent work
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    performTask(tasks.shift());
  }
});

// Or use scheduler API
await scheduler.yield();`,
          learnMoreUrl: 'https://web.dev/optimize-long-tasks/',
        },
      });
    }
  }

  return issues;
}

// Convert performance metrics to issues
function metricsToIssues(metrics: PerformanceMetric[]): Issue[] {
  const issues: Issue[] = [];

  for (const metric of metrics) {
    // Only create issues for metrics that need improvement or are poor
    if (metric.rating === 'good') continue;

    const severity = mapRatingToSeverity(metric.rating);
    const valueFormatted = metric.value.toFixed(
      metric.unit === 'ms' || metric.unit === 'KB' ? 0 : 2
    );

    issues.push({
      id: generateId(),
      ruleId: `performance-${metric.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      severity,
      category: 'technical' as Category,
      message: `${metric.name}: ${valueFormatted}${metric.unit}`,
      description: `This metric is rated as "${metric.rating}". Good: ≤${metric.threshold.good}${metric.unit}, Needs improvement: ≤${metric.threshold.poor}${metric.unit}`,
      helpUrl: 'https://web.dev/vitals/',
      wcag: {
        id: 'Performance',
        level: 'AA',
        name: 'Performance Optimization',
        description: 'Web performance optimization for better user experience',
      } as WCAGCriteria,
      element: {
        selector: 'body',
        html: '<body>...</body>',
        failureSummary: `${metric.name} is ${valueFormatted}${metric.unit}, which is ${metric.rating === 'needs-improvement' ? 'slower than recommended' : 'poor'}`,
      },
      fix: {
        description: getFixDescription(metric),
        code: getFixCode(metric),
        learnMoreUrl: getLearnMoreUrl(metric.name),
      },
    });
  }

  return issues;
}

function getFixDescription(metric: PerformanceMetric): string {
  const name = metric.name.toLowerCase();

  if (name.includes('cls') || name.includes('layout shift')) {
    return 'Reduce Cumulative Layout Shift by adding explicit dimensions to images/videos, avoiding inserting content above existing content, and using transform animations instead of properties that trigger layout.';
  }
  if (name.includes('lcp')) {
    return 'Optimize Largest Contentful Paint by reducing server response times, eliminating render-blocking resources, optimizing images, and using lazy loading.';
  }
  if (name.includes('fcp')) {
    return 'Improve First Contentful Paint by minimizing critical resources, removing unused CSS, and preloading key requests.';
  }
  if (name.includes('ttfb')) {
    return 'Reduce Time to First Byte by optimizing server response times, using CDN, and enabling caching.';
  }
  if (name.includes('resource size')) {
    return 'Reduce total resource size by compressing assets, using modern image formats (WebP, AVIF), and code splitting.';
  }
  if (name.includes('image')) {
    return 'Optimize images by compressing them, using responsive images with srcset, and lazy loading off-screen images.';
  }
  if (name.includes('javascript')) {
    return 'Reduce JavaScript bundle size by code splitting, tree shaking, and removing unused dependencies.';
  }
  if (name.includes('resources')) {
    return 'Reduce the number of resources by combining files, using HTTP/2, and removing unused assets.';
  }

  return 'Optimize this performance metric by following web performance best practices.';
}

function getFixCode(metric: PerformanceMetric): string {
  const name = metric.name.toLowerCase();

  if (name.includes('cls') || name.includes('layout shift')) {
    return `<!-- Always include width and height on images -->
<img src="image.jpg" width="800" height="600" alt="...">

<!-- Reserve space for dynamic content -->
<div style="min-height: 200px;">
  <!-- Dynamic content loads here -->
</div>

<!-- Use CSS aspect-ratio for responsive images -->
<img src="image.jpg" style="aspect-ratio: 16/9; width: 100%;">

<!-- Use transform for animations instead of top/left -->
.animate {
  transform: translateY(10px); /* Good */
  /* top: 10px; Bad - causes layout shift */
}`;
  }

  if (name.includes('image')) {
    return `<!-- Use modern image formats and lazy loading -->
<img
  src="image.webp"
  alt="Description"
  loading="lazy"
  width="800"
  height="600"
/>`;
  }

  if (name.includes('javascript')) {
    return `// Use dynamic imports for code splitting
const module = await import('./module.js');

// Remove unused dependencies from package.json
// Use tree shaking with modern bundlers`;
  }

  if (name.includes('lcp') || name.includes('fcp')) {
    return `<!-- Preload critical resources -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="hero.webp" as="image">

<!-- Eliminate render-blocking CSS -->
<link rel="stylesheet" href="styles.css" media="print" onload="this.media='all'">`;
  }

  return `<!-- Follow performance best practices -->
<!-- - Compress and optimize assets -->
<!-- - Use CDN for static resources -->
<!-- - Enable caching headers -->
<!-- - Minimize critical resources -->`;
}

function getLearnMoreUrl(metricName: string): string {
  const name = metricName.toLowerCase();

  if (name.includes('lcp')) return 'https://web.dev/lcp/';
  if (name.includes('fcp')) return 'https://web.dev/fcp/';
  if (name.includes('fid')) return 'https://web.dev/fid/';
  if (name.includes('cls')) return 'https://web.dev/cls/';
  if (name.includes('ttfb')) return 'https://web.dev/ttfb/';

  return 'https://web.dev/performance/';
}

function generateSummary(issues: Issue[]): ScanSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  const byCategory: Record<Category, number> = {
    images: 0,
    interactive: 0,
    forms: 0,
    color: 0,
    document: 0,
    structure: 0,
    aria: 0,
    technical: 0,
  };

  for (const issue of issues) {
    bySeverity[issue.severity]++;
    byCategory[issue.category]++;
  }

  return {
    total: issues.length,
    bySeverity,
    byCategory,
  };
}

export async function scanPerformance(): Promise<ScanResult> {
  const startTime = performance.now();

  // Measure Core Web Vitals in parallel
  const clsPromise = measureCLS();
  const inpPromise = measureINP();
  const tbtPromise = measureTBT();

  // Wait a bit to ensure metrics are collected
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Collect all metrics
  const navigationMetrics = getNavigationMetrics();
  const resourceMetrics = getResourceMetrics();
  const allMetrics = [...navigationMetrics, ...resourceMetrics];

  // Wait for Core Web Vitals measurements to complete
  const [clsResult, inpResult, tbtResult] = await Promise.all([clsPromise, inpPromise, tbtPromise]);

  // Convert metrics to issues
  const metricIssues = metricsToIssues(allMetrics);
  const clsIssues = clsToIssues(clsResult);
  const inpIssues = inpToIssues(inpResult);
  const tbtIssues = tbtToIssues(tbtResult);

  // Combine all issues
  const issues = [...metricIssues, ...clsIssues, ...inpIssues, ...tbtIssues];

  const duration = performance.now() - startTime;

  return {
    url: window.location.href,
    timestamp: Date.now(),
    duration,
    issues,
    incomplete: [],
    summary: generateSummary(issues),
  };
}
