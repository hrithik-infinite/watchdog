# WatchDog Implementation Roadmap

**Last Updated:** 2026-01-17

A phased implementation plan to achieve feature parity with Lighthouse and beyond.

---

## Overview

| Phase | Focus | Target Version | Priority | Status |
|-------|-------|----------------|----------|--------|
| Phase 1 | Core Web Vitals & Accessibility | v1.2 | Critical | ✅ Complete |
| Phase 2 | Resource Analysis & Best Practices | v1.3 | High | ✅ Complete |
| Phase 3 | Advanced Performance & SEO | v1.4 | High | 🔜 Next |
| Phase 4 | Mobile & PWA Enhancements | v1.5 | Medium | Pending |
| Phase 5 | Developer Tools & CI/CD | v2.0 | Medium | Pending |
| Phase 6 | Enterprise Features | v2.1 | Lower | Pending |

---

## Phase 1: Core Web Vitals & Accessibility (v1.2) ✅ COMPLETED

**Goal:** Complete Core Web Vitals coverage and expand accessibility rules.

**Status:** ✅ Completed on 2026-01-17

### 1.1 Core Web Vitals Completion

#### CLS (Cumulative Layout Shift)
- **Priority:** Critical
- **Effort:** 2-3 days
- **Files to modify:**
  - `src/content/scanners/performance.ts`
  - `src/shared/types.ts` (add CLS types)

```typescript
// Implementation approach
interface CLSMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  shiftingElements: Array<{
    selector: string;
    shift: number;
  }>;
}

// Thresholds
const CLS_THRESHOLDS = {
  good: 0.1,
  poor: 0.25
};
```

**Tasks:**
- [x] Add PerformanceObserver for layout-shift entries
- [x] Track cumulative shift value
- [x] Identify elements causing shifts
- [x] Generate actionable issues with element selectors
- [x] Add to performance score calculation

#### INP (Interaction to Next Paint)
- **Priority:** Critical
- **Effort:** 2-3 days
- **Dependencies:** `web-vitals` library (already available)

```typescript
// Implementation approach
import { onINP } from 'web-vitals';

interface INPMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  worstInteraction: {
    type: string;
    target: string;
    duration: number;
  };
}

// Thresholds
const INP_THRESHOLDS = {
  good: 200,
  poor: 500
};
```

**Tasks:**
- [x] Integrate web-vitals onINP
- [x] Capture interaction details
- [x] Report slow interactions with element info
- [x] Add to performance score

#### TBT (Total Blocking Time)
- **Priority:** High
- **Effort:** 1-2 days

```typescript
// Implementation approach
function measureTBT(): number {
  const longTasks = performance.getEntriesByType('longtask');
  return longTasks.reduce((total, task) => {
    const blocking = task.duration - 50; // Blocking = duration - 50ms
    return total + Math.max(0, blocking);
  }, 0);
}

// Thresholds
const TBT_THRESHOLDS = {
  good: 200,
  poor: 600
};
```

**Tasks:**
- [x] Add PerformanceObserver for longtask entries
- [x] Calculate total blocking time
- [x] Identify blocking scripts
- [x] Generate optimization suggestions

### 1.2 Accessibility Rules Expansion

#### Add 20 High-Impact Rules
- **Priority:** High
- **Effort:** 3-4 days
- **File:** `src/content/scanners/accessibility.ts`

**Batch 1: Navigation & Focus (5 rules)**
```typescript
const PHASE1_RULES = [
  'bypass',                      // Skip navigation
  'focus-order-semantics',       // Focus order
  'scrollable-region-focusable', // Scrollable areas
  'frame-focusable-content',     // Frame focus
  'tabindex',                    // No positive tabindex
];
```

**Tasks:**
- [x] Add rules to MVP_RULES array
- [x] Map new rules to categories
- [x] Add WCAG criteria mappings
- [x] Add fix templates for all new rules
- [ ] Test with real pages

**Batch 2: Media & Multimedia (5 rules)**
```typescript
const MEDIA_RULES = [
  'video-caption',      // Video captions
  'audio-caption',      // Audio descriptions
  'no-autoplay-audio',  // No autoplay
  'object-alt',         // Object alt text
  'svg-img-alt',        // SVG alt text
];
```

**Batch 3: Tables (4 rules)**
```typescript
const TABLE_RULES = [
  'td-headers-attr',      // Header associations
  'th-has-data-cells',    // Headers have data
  'table-duplicate-name', // Unique captions
  'scope-attr-valid',     // Valid scope
];
```

**Batch 4: Structure (6 rules)**
```typescript
const STRUCTURE_RULES = [
  'definition-list',    // DL structure
  'list',               // List structure
  'listitem',           // LI in lists
  'dlitem',             // DT/DD in DL
  'nested-interactive', // No nesting
  'valid-lang',         // Valid language
];
```

### 1.3 Phase 1 Deliverables

| Deliverable | Success Criteria | Status |
|-------------|------------------|--------|
| CLS measurement | Reports score with shifting elements | ✅ Done |
| INP measurement | Reports score with slow interactions | ✅ Done |
| TBT measurement | Reports blocking time with culprits | ✅ Done |
| 20 new a11y rules | All rules functional with issues | ✅ Done |
| Updated scoring | All new metrics in score calculation | ✅ Done |

---

## Phase 2: Resource Analysis & Best Practices (v1.3) ✅ COMPLETED

**Goal:** Add resource optimization audits and improve best practices coverage.

**Status:** ✅ Completed on 2026-01-17

### 2.1 Console Error Detection

- **Priority:** Critical
- **Effort:** 1-2 days
- **File:** `src/content/scanners/best-practices.ts`

```typescript
// Implementation approach
interface ConsoleCapture {
  errors: string[];
  warnings: string[];
  count: { errors: number; warnings: number };
}

// Inject into page context early
function captureConsole(): ConsoleCapture {
  const capture: ConsoleCapture = {
    errors: [],
    warnings: [],
    count: { errors: 0, warnings: 0 }
  };

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    capture.errors.push(args.map(String).join(' '));
    capture.count.errors++;
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    capture.warnings.push(args.map(String).join(' '));
    capture.count.warnings++;
    originalWarn.apply(console, args);
  };

  return capture;
}
```

**Tasks:**
- [x] Inject console capture script early in page load (document_start with MAIN world)
- [x] Collect errors and warnings (including unhandled rejections)
- [x] Report count and sample messages
- [x] Categorize by type (JS error, network, deprecation)

### 2.2 Vulnerable Libraries Detection

- **Priority:** High
- **Effort:** 3-4 days
- **New file:** `src/content/scanners/security-libs.ts`

```typescript
// Implementation approach
interface LibraryInfo {
  name: string;
  version: string;
  detectedVia: 'global' | 'comment' | 'path';
}

interface Vulnerability {
  library: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cve: string;
  description: string;
  fixedIn: string;
}

// Detection patterns
const LIBRARY_DETECTORS = {
  jquery: () => (window as any).jQuery?.fn?.jquery,
  lodash: () => (window as any)._?.VERSION,
  react: () => (window as any).React?.version,
  angular: () => (window as any).angular?.version?.full,
  vue: () => (window as any).Vue?.version,
  bootstrap: () => (window as any).bootstrap?.VERSION,
  moment: () => (window as any).moment?.version,
};

// Vulnerability database (simplified, use retire.js or Snyk API)
const KNOWN_VULNERABILITIES: Record<string, Vulnerability[]> = {
  'jquery': [
    {
      library: 'jquery',
      version: '<3.5.0',
      severity: 'medium',
      cve: 'CVE-2020-11022',
      description: 'XSS vulnerability in jQuery.htmlPrefilter',
      fixedIn: '3.5.0'
    }
  ],
  // ... more libraries
};
```

**Tasks:**
- [x] Detect common libraries via window globals (jQuery, Lodash, React, Angular, Vue, Moment, Bootstrap, Backbone, Ember)
- [x] Parse version from library globals
- [x] Check against vulnerability database (8 known CVEs for jQuery, Lodash, Moment, Angular, Bootstrap)
- [x] Report CVE details and fix versions
- [x] Add severity-based scoring

### 2.3 Additional Best Practices

**Password Paste Prevention**
```typescript
function checkPasswordPaste(): Issue[] {
  const issues: Issue[] = [];

  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const onpaste = input.getAttribute('onpaste');
    if (onpaste?.includes('return false') || onpaste?.includes('preventDefault')) {
      issues.push({
        // ... issue details
        message: 'Password field prevents paste',
        fix: { description: 'Remove paste prevention to allow password managers' }
      });
    }
  });

  return issues;
}
```

**Tasks:**
- [x] Detect password paste prevention
- [x] Check for notification permission on load
- [x] Verify image aspect ratios
- [x] Check for unsized images

### 2.4 Phase 2 Deliverables

| Deliverable | Success Criteria | Status |
|-------------|------------------|--------|
| Console error capture | Reports errors with messages | ✅ Done |
| Library vulnerability scan | Detects 10 common libraries, 8 CVEs | ✅ Done |
| 4 new best practice checks | Password paste, notifications, images | ✅ Done |

---

## Phase 3: Advanced Performance & SEO (v1.4)

**Goal:** Add advanced performance optimizations and complete SEO coverage.

### 3.1 Image Optimization Audit

- **Priority:** High
- **Effort:** 3-4 days

```typescript
interface ImageAudit {
  url: string;
  displaySize: { width: number; height: number };
  naturalSize: { width: number; height: number };
  fileSize: number;
  format: string;
  issues: Array<{
    type: 'oversized' | 'wrong-format' | 'no-dimensions' | 'not-lazy';
    savings?: number;
    suggestion: string;
  }>;
}

async function auditImages(): Promise<ImageAudit[]> {
  const images = Array.from(document.images);
  const audits: ImageAudit[] = [];

  for (const img of images) {
    const audit: ImageAudit = {
      url: img.src,
      displaySize: { width: img.clientWidth, height: img.clientHeight },
      naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
      fileSize: 0, // From Resource Timing
      format: img.src.split('.').pop() || 'unknown',
      issues: []
    };

    // Check if oversized
    const displayPixels = audit.displaySize.width * audit.displaySize.height;
    const naturalPixels = audit.naturalSize.width * audit.naturalSize.height;

    if (naturalPixels > displayPixels * 2) {
      audit.issues.push({
        type: 'oversized',
        savings: Math.round((1 - displayPixels / naturalPixels) * 100),
        suggestion: `Resize to ${audit.displaySize.width}x${audit.displaySize.height}`
      });
    }

    // Check format
    if (['jpg', 'jpeg', 'png'].includes(audit.format.toLowerCase())) {
      audit.issues.push({
        type: 'wrong-format',
        suggestion: 'Convert to WebP or AVIF for 25-50% savings'
      });
    }

    // Check dimensions
    if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
      audit.issues.push({
        type: 'no-dimensions',
        suggestion: 'Add width and height attributes to prevent CLS'
      });
    }

    // Check lazy loading
    const rect = img.getBoundingClientRect();
    const isOffscreen = rect.top > window.innerHeight;

    if (isOffscreen && img.loading !== 'lazy') {
      audit.issues.push({
        type: 'not-lazy',
        suggestion: 'Add loading="lazy" for offscreen images'
      });
    }

    audits.push(audit);
  }

  return audits;
}
```

**Tasks:**
- [ ] Detect oversized images
- [ ] Check image formats
- [ ] Verify dimension attributes
- [ ] Check lazy loading for offscreen
- [ ] Estimate byte savings

### 3.2 Cache Policy Analysis

- **Priority:** Medium
- **Effort:** 2-3 days

```typescript
interface CacheAudit {
  url: string;
  resourceType: string;
  cacheControl: string | null;
  maxAge: number | null;
  issues: string[];
  suggestion: string;
}

function analyzeCachePolicy(): CacheAudit[] {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const audits: CacheAudit[] = [];

  // Note: Cache-Control headers not directly accessible
  // Use heuristics or background script fetch

  for (const resource of resources) {
    // Check if resource is cacheable based on type
    const url = resource.name;
    const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/i.test(url);

    if (isStatic && resource.transferSize > 0) {
      // Resource was fetched, not cached
      audits.push({
        url,
        resourceType: resource.initiatorType,
        cacheControl: null,
        maxAge: null,
        issues: ['Resource not served from cache'],
        suggestion: 'Add Cache-Control header with max-age'
      });
    }
  }

  return audits;
}
```

### 3.3 SEO Enhancements

**Robots.txt Check**
```typescript
async function checkRobotsTxt(): Promise<Issue | null> {
  try {
    const response = await fetch('/robots.txt');
    if (!response.ok) {
      return {
        // ... issue
        message: 'robots.txt not found',
        severity: 'moderate'
      };
    }

    const text = await response.text();

    // Check for blocking directives
    if (text.includes('Disallow: /')) {
      return {
        message: 'robots.txt may block important pages',
        severity: 'moderate'
      };
    }
  } catch {
    return {
      message: 'Could not fetch robots.txt',
      severity: 'minor'
    };
  }

  return null;
}
```

**Tap Target Sizing**
```typescript
interface TapTarget {
  element: Element;
  selector: string;
  size: { width: number; height: number };
  tooSmall: boolean;
}

function checkTapTargets(): TapTarget[] {
  const MIN_SIZE = 48; // 48x48px minimum
  const interactives = document.querySelectorAll('a, button, input, select, textarea, [onclick]');
  const tooSmall: TapTarget[] = [];

  interactives.forEach((el) => {
    const rect = el.getBoundingClientRect();

    if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
      tooSmall.push({
        element: el,
        selector: getSelector(el),
        size: { width: rect.width, height: rect.height },
        tooSmall: true
      });
    }
  });

  return tooSmall;
}
```

**Tasks:**
- [ ] Check robots.txt accessibility
- [ ] Verify XML sitemap
- [ ] Analyze tap target sizes
- [ ] Check font legibility
- [ ] Detect JavaScript-only links

### 3.4 Phase 3 Deliverables

| Deliverable | Success Criteria |
|-------------|------------------|
| Image optimization audit | Reports all optimization opportunities |
| Cache policy check | Identifies uncached resources |
| Robots.txt validation | Checks accessibility and content |
| Tap target audit | Reports undersized targets |
| Font legibility check | Identifies small text |

---

## Phase 4: Mobile & PWA Enhancements (v1.5)

**Goal:** Complete mobile responsiveness and PWA audit coverage.

### 4.1 Mobile Responsiveness Scanner

- **Priority:** Medium
- **Effort:** 4-5 days
- **New file:** `src/content/scanners/mobile.ts`

```typescript
interface MobileAudit {
  viewport: {
    configured: boolean;
    width: string;
    initialScale: number;
  };
  contentWidth: {
    fits: boolean;
    overflowElements: string[];
  };
  tapTargets: {
    total: number;
    tooSmall: number;
    elements: TapTarget[];
  };
  fontSize: {
    legible: boolean;
    smallTextElements: string[];
  };
  horizontalScroll: boolean;
}

async function runMobileAudit(): Promise<MobileAudit> {
  return {
    viewport: checkViewport(),
    contentWidth: checkContentWidth(),
    tapTargets: checkTapTargets(),
    fontSize: checkFontSize(),
    horizontalScroll: checkHorizontalScroll()
  };
}

function checkContentWidth(): { fits: boolean; overflowElements: string[] } {
  const viewportWidth = window.innerWidth;
  const overflowing: string[] = [];

  document.querySelectorAll('*').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.right > viewportWidth + 1) {
      overflowing.push(getSelector(el));
    }
  });

  return {
    fits: overflowing.length === 0,
    overflowElements: overflowing.slice(0, 10) // Top 10
  };
}

function checkFontSize(): { legible: boolean; smallTextElements: string[] } {
  const MIN_FONT_SIZE = 12;
  const smallText: string[] = [];

  document.querySelectorAll('p, span, a, li, td, th, label').forEach((el) => {
    const style = getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);

    if (fontSize < MIN_FONT_SIZE && el.textContent?.trim()) {
      smallText.push(getSelector(el));
    }
  });

  return {
    legible: smallText.length === 0,
    smallTextElements: smallText.slice(0, 10)
  };
}
```

### 4.2 PWA Offline Testing

- **Priority:** Medium
- **Effort:** 3-4 days

```typescript
interface OfflineAudit {
  serviceWorkerActive: boolean;
  offlineResponse: {
    tested: boolean;
    statusCode: number | null;
    hasContent: boolean;
  };
  cachedResources: string[];
}

async function testOfflineCapability(): Promise<OfflineAudit> {
  const audit: OfflineAudit = {
    serviceWorkerActive: false,
    offlineResponse: { tested: false, statusCode: null, hasContent: false },
    cachedResources: []
  };

  // Check service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    audit.serviceWorkerActive = registrations.length > 0;
  }

  // Check cache storage
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      audit.cachedResources.push(...keys.map(r => r.url));
    }
  }

  // Note: Actually testing offline requires network interception
  // which is complex in content scripts

  return audit;
}
```

### 4.3 PWA Manifest Deep Validation

```typescript
interface ManifestAudit {
  exists: boolean;
  valid: boolean;
  fields: {
    name: boolean;
    shortName: boolean;
    startUrl: boolean;
    display: boolean;
    themeColor: boolean;
    backgroundColor: boolean;
    icons: {
      has192: boolean;
      has512: boolean;
      hasMaskable: boolean;
    };
  };
  installable: boolean;
  splashScreen: boolean;
}
```

### 4.4 Phase 4 Deliverables

| Deliverable | Success Criteria |
|-------------|------------------|
| Mobile scanner | Complete mobile responsiveness audit |
| Viewport validation | Detailed viewport issues |
| Content width check | Identifies overflowing elements |
| Tap target audit | Full coverage with visual info |
| Font legibility | Identifies all small text |
| PWA offline test | Service worker & cache validation |
| Manifest deep check | All fields validated |

---

## Phase 5: Developer Tools & CI/CD (v2.0)

**Goal:** Add developer-focused features for workflow integration.

### 5.1 CLI Tool

- **Priority:** High
- **Effort:** 1-2 weeks
- **New package:** `watchdog-cli`

```bash
# Usage examples
watchdog scan https://example.com --format json
watchdog scan https://example.com --audits accessibility,performance
watchdog scan https://example.com --budget budget.json
watchdog scan https://example.com --output report.html
```

```typescript
// CLI structure
interface CLIOptions {
  url: string;
  audits: AuditType[];
  format: 'json' | 'html' | 'csv';
  output?: string;
  budget?: string;
  threshold?: number;
  timeout?: number;
}

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  ISSUES_FOUND: 1,
  BUDGET_EXCEEDED: 2,
  THRESHOLD_FAILED: 3,
  ERROR: 4
};
```

**Tasks:**
- [ ] Create separate CLI package
- [ ] Use Puppeteer for headless scanning
- [ ] Implement all output formats
- [ ] Add budget support
- [ ] Add threshold-based exit codes

### 5.2 Performance Budgets

```typescript
interface PerformanceBudget {
  metrics: {
    LCP?: number;
    CLS?: number;
    INP?: number;
    TBT?: number;
  };
  resources: {
    total?: number;
    javascript?: number;
    css?: number;
    images?: number;
    fonts?: number;
  };
  counts: {
    requests?: number;
    thirdParty?: number;
  };
}

// budget.json example
{
  "metrics": {
    "LCP": 2500,
    "CLS": 0.1,
    "INP": 200
  },
  "resources": {
    "javascript": 300000,
    "css": 100000,
    "images": 500000
  },
  "counts": {
    "requests": 50
  }
}
```

### 5.3 GitHub Actions Integration

```yaml
# .github/workflows/watchdog.yml
name: WatchDog Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start server
        run: npm start &

      - name: Run WatchDog
        uses: watchdog/action@v1
        with:
          url: http://localhost:3000
          audits: accessibility,performance,seo
          budget: ./budget.json
          threshold: 80

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: watchdog-report
          path: watchdog-report.html
```

### 5.4 VS Code Extension

- **Priority:** Medium
- **Effort:** 1-2 weeks

**Features:**
- Run audits from VS Code
- Inline issue highlighting
- Quick fixes for common issues
- Score in status bar

### 5.5 Phase 5 Deliverables

| Deliverable | Success Criteria |
|-------------|------------------|
| CLI tool | Functional with all options |
| Budget support | JSON budget file parsing |
| GitHub Action | Published to marketplace |
| CI/CD docs | Complete integration guide |
| VS Code extension | Basic functionality |

---

## Phase 6: Enterprise Features (v2.1)

**Goal:** Add features for teams and organizations.

### 6.1 Historical Tracking

```typescript
interface ScanHistory {
  id: string;
  url: string;
  timestamp: number;
  scores: Record<AuditType, number>;
  issueCount: number;
  metrics: Record<string, number>;
}

interface TrendData {
  url: string;
  scans: ScanHistory[];
  trend: 'improving' | 'stable' | 'declining';
  averageScore: number;
}
```

### 6.2 Team Dashboard

**Features:**
- Multiple site monitoring
- Score trends over time
- Team notifications
- Scheduled scans
- Comparison reports

### 6.3 Custom Rules

```typescript
interface CustomRule {
  id: string;
  name: string;
  description: string;
  selector: string;
  check: (element: Element) => boolean;
  message: string;
  severity: Severity;
}

// Example custom rule
const customRules: CustomRule[] = [
  {
    id: 'brand-alt-text',
    name: 'Brand-compliant alt text',
    description: 'Images must have brand-compliant alt text',
    selector: 'img',
    check: (el) => {
      const alt = el.getAttribute('alt') || '';
      return !alt.toLowerCase().includes('image of');
    },
    message: 'Alt text should not start with "image of"',
    severity: 'minor'
  }
];
```

### 6.4 API Access

```typescript
// REST API for programmatic access
// POST /api/scan
{
  "url": "https://example.com",
  "audits": ["accessibility", "performance"],
  "options": {
    "wcagLevel": "AA",
    "device": "mobile"
  }
}

// Response
{
  "id": "scan-123",
  "status": "complete",
  "scores": {
    "accessibility": 85,
    "performance": 72
  },
  "issues": [...],
  "metrics": {...}
}
```

### 6.5 Phase 6 Deliverables

| Deliverable | Success Criteria |
|-------------|------------------|
| Scan history storage | Persistent storage with trends |
| Trend visualization | Charts showing score over time |
| Team dashboard | Multi-site monitoring UI |
| Custom rules engine | User-defined rules working |
| REST API | Documented API endpoints |
| Scheduled scans | Automated recurring scans |

---

## Timeline Summary

| Phase | Duration | Target Date |
|-------|----------|-------------|
| Phase 1 | 2-3 weeks | Feb 2026 |
| Phase 2 | 3-4 weeks | Mar 2026 |
| Phase 3 | 3-4 weeks | Apr 2026 |
| Phase 4 | 2-3 weeks | May 2026 |
| Phase 5 | 4-6 weeks | Jul 2026 |
| Phase 6 | 6-8 weeks | Sep 2026 |

---

## Success Metrics

### Phase 1 Success ✅
- [x] All Core Web Vitals measured (CLS, INP, TBT added)
- [x] 35 accessibility rules active (expanded from 15)
- [ ] Score accuracy within 5% of Lighthouse (needs testing)

### Phase 2 Success ✅
- [x] Console errors detected (with early injection via MAIN world)
- [x] 10 libraries detected, 8 known CVEs tracked
- [x] Additional best practices (password paste, notifications, images)

### Phase 3 Success
- [ ] Image optimization savings accurate
- [ ] SEO score comparable to Lighthouse
- [ ] Tap target issues detected

### Phase 4 Success
- [ ] Mobile audit covers all Lighthouse checks
- [ ] PWA audit complete
- [ ] Installability criteria validated

### Phase 5 Success
- [ ] CLI used in 100+ CI pipelines
- [ ] GitHub Action published
- [ ] VS Code extension 1000+ installs

### Phase 6 Success
- [ ] 10+ enterprise customers
- [ ] API handling 10k+ scans/day
- [ ] Custom rules used by 50+ teams

---

## Resources Required

### Development
- 1-2 full-time developers
- Part-time designer for dashboard
- QA for cross-browser testing

### Infrastructure
- Cloud hosting for API (Phase 6)
- Database for history storage
- CDN for CLI distribution

### External Services
- Vulnerability database subscription
- Puppeteer/Playwright cloud for CI

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser API changes | High | Abstract browser APIs, test on beta |
| axe-core updates | Medium | Pin versions, test upgrades |
| Performance overhead | Medium | Lazy loading, worker threads |
| Cross-origin restrictions | High | Document limitations, use background |

---

## References

- [Lighthouse Architecture](https://github.com/GoogleChrome/lighthouse/blob/main/docs/architecture.md)
- [Web Vitals](https://web.dev/vitals/)
- [axe-core API](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
