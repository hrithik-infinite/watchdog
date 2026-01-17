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

// Core Web Vitals thresholds (from Google)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 }, // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
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

  // Wait a bit to ensure metrics are collected
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Collect all metrics
  const navigationMetrics = getNavigationMetrics();
  const resourceMetrics = getResourceMetrics();
  const allMetrics = [...navigationMetrics, ...resourceMetrics];

  // Convert metrics to issues
  const issues = metricsToIssues(allMetrics);

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
