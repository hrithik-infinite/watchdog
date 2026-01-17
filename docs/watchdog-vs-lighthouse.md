# WatchDog vs Lighthouse: Feature Comparison

**Last Updated:** 2026-01-17

This document compares WatchDog's current capabilities against Google Lighthouse to identify feature gaps and prioritize future development.

---

## Current WatchDog Features

| Category | WatchDog | Status |
|----------|----------|--------|
| **Accessibility** | 35 axe-core rules | ✅ Implemented |
| **Performance** | Full Core Web Vitals (LCP, FCP, TTFB, CLS, INP, TBT) | ✅ Implemented |
| **SEO** | 9 checks | ✅ Implemented |
| **Security** | 9 check categories | ✅ Implemented |
| **Best Practices** | 17 checks (console errors, vulnerable libs, image checks, etc.) | ✅ Implemented |
| **PWA** | 7 checks | ✅ Implemented |
| **Mobile** | - | Not Implemented |
| **Links** | - | Not Implemented |
| **i18n** | - | Not Implemented |
| **Privacy** | - | Not Implemented |

---

## Accessibility Gaps

### Currently Implemented (35 rules) ✅

| Category | Rules |
|----------|-------|
| **Images** | `image-alt`, `video-caption`, `audio-caption`, `no-autoplay-audio`, `object-alt`, `svg-img-alt` |
| **Interactive** | `button-name`, `link-name`, `bypass`, `scrollable-region-focusable`, `frame-focusable-content`, `focus-order-semantics`, `nested-interactive` |
| **Forms** | `label`, `input-image-alt`, `select-name`, `autocomplete-valid` |
| **Color** | `color-contrast` |
| **Document** | `html-has-lang`, `document-title`, `meta-viewport`, `frame-title`, `valid-lang` |
| **Structure** | `heading-order`, `region`, `td-headers-attr`, `th-has-data-cells`, `scope-attr-valid`, `table-fake-caption`, `definition-list`, `list`, `listitem` |
| **ARIA** | `aria-valid-attr`, `aria-required-attr`, `aria-roles` |
| **Technical** | `tabindex`, `duplicate-id`, `marquee`, `blink` |

### Remaining axe-core Rules (Not Yet Implemented)

#### Forms & Inputs
- [ ] `form-field-multiple-labels` - Form fields have single labels

#### Frames & Embedded Content
- [ ] `frame-title-unique` - Iframe titles are unique

#### Deprecated Elements
- [ ] `server-side-image-map` - No server-side image maps

#### Language
- [ ] `html-xml-lang-mismatch` - HTML and XML lang match

#### Other
- [ ] `meta-refresh` - No auto-refresh meta tags
- [ ] `identical-links-same-purpose` - Identical links go to same place
- [ ] `landmark-banner-is-top-level` - Banner is top level
- [ ] `landmark-contentinfo-is-top-level` - Contentinfo is top level
- [ ] `landmark-main-is-top-level` - Main is top level
- [ ] `landmark-no-duplicate-banner` - Only one banner
- [ ] `landmark-no-duplicate-contentinfo` - Only one contentinfo
- [ ] `landmark-no-duplicate-main` - Only one main
- [ ] `landmark-unique` - Landmarks are unique
- [ ] `page-has-heading-one` - Page has h1

---

## Performance Gaps

### Currently Implemented ✅

| Metric | Threshold (Good) | Threshold (Poor) | Status |
|--------|------------------|------------------|--------|
| LCP (Largest Contentful Paint) | < 2500ms | > 4000ms | ✅ |
| FCP (First Contentful Paint) | < 1800ms | > 3000ms | ✅ |
| TTFB (Time to First Byte) | < 800ms | > 1800ms | ✅ |
| DOM Content Loaded | < 1000ms | > 2000ms | ✅ |
| Page Load Time | < 2000ms | > 4000ms | ✅ |
| CLS (Cumulative Layout Shift) | < 0.1 | > 0.25 | ✅ |
| INP (Interaction to Next Paint) | < 200ms | > 500ms | ✅ |
| TBT (Total Blocking Time) | < 200ms | > 600ms | ✅ |

### Core Web Vitals - All Implemented ✅

- [x] **CLS (Cumulative Layout Shift)** - Visual stability metric
  - Good: < 0.1, Poor: > 0.25
  - Implementation: `PerformanceObserver` with `layout-shift` entries
  - Reports shifting elements with selectors

- [x] **INP (Interaction to Next Paint)** - Responsiveness metric (replaced FID)
  - Good: < 200ms, Poor: > 500ms
  - Implementation: Monitors click, keydown, pointerdown events
  - Reports worst interaction details

- [x] **TBT (Total Blocking Time)** - Main thread blocking
  - Good: < 200ms, Poor: > 600ms
  - Implementation: `PerformanceObserver` with `longtask` entries
  - Reports individual long tasks with blocking time

### Missing Performance Audits

#### Resource Optimization
- [ ] **Unused CSS detection** - CSS coverage analysis
- [ ] **Unused JavaScript detection** - JS coverage analysis
- [ ] **Render-blocking resources** - CSS/JS blocking first paint
- [ ] **Text compression** - Gzip/Brotli not enabled
- [ ] **Image optimization** - Unoptimized images (WebP, AVIF)
- [ ] **Properly sized images** - Images larger than display size
- [ ] **Responsive images** - Missing srcset/sizes
- [ ] **Next-gen image formats** - JPEG/PNG instead of WebP/AVIF
- [ ] **Efficient cache policy** - Missing or short cache headers
- [ ] **Minified CSS/JS** - Unminified resources

#### Loading Optimization
- [ ] **Critical request chains** - Deep dependency chains
- [ ] **Preload key requests** - LCP image not preloaded
- [ ] **Preconnect to origins** - Third-party origins
- [ ] **Lazy load images** - Offscreen images not lazy loaded
- [ ] **Font display** - FOIT/FOUT issues
- [ ] **Avoid document.write** - Blocking script injection

#### Third-Party Impact
- [ ] **Third-party code impact** - Blocking third-party scripts
- [ ] **Third-party facades** - Defer third-party embeds
- [ ] **Legacy JavaScript** - Polyfills for modern browsers

#### Advanced Metrics
- [ ] **Speed Index** - Visual completeness over time
- [ ] **Time to Interactive (TTI)** - When page is fully interactive
- [ ] **Max Potential FID** - Worst-case input delay

---

## SEO Gaps

### Currently Implemented (9 checks)

- [x] Page title presence and length
- [x] Meta description presence and length
- [x] Single H1 heading
- [x] Open Graph tags
- [x] Canonical URL
- [x] Viewport meta tag
- [x] HTTPS protocol
- [x] Image alt text
- [x] Structured data (JSON-LD)

### Missing SEO Audits

#### Crawlability
- [ ] **Robots.txt** - Valid and accessible
- [ ] **XML Sitemap** - Present and valid
- [ ] **Crawlable links** - Links not using JavaScript
- [ ] **Valid hreflang** - Correct hreflang implementation
- [ ] **Indexability** - Page is indexable

#### Mobile SEO
- [ ] **Tap targets sized** - Touch targets >= 48x48px
- [ ] **Font size legible** - Text >= 12px
- [ ] **Content wider than screen** - Horizontal scrolling

#### Content Quality
- [ ] **Link text quality** - Descriptive link text
- [ ] **Image filenames** - Descriptive image names

#### Technical SEO
- [ ] **Plugins** - No Flash or other plugins
- [ ] **HTTP status code** - Successful status
- [ ] **Is HTTPS** - Secure protocol

---

## Best Practices Gaps

### Currently Implemented (11 checks)

- [x] DOCTYPE declaration
- [x] Character encoding (UTF-8)
- [x] Language attribute
- [x] Deprecated HTML elements
- [x] Broken images
- [x] Duplicate IDs
- [x] Empty/invalid links
- [x] javascript: protocol links
- [x] Meta refresh
- [x] Passive event listeners
- [x] Geolocation on load

### Missing Best Practices Audits

#### JavaScript & Console
- [ ] **Console errors** - No browser errors logged
- [ ] **Console warnings** - Minimize warnings
- [ ] **Unhandled promise rejections** - All promises handled

#### Security & Privacy
- [ ] **Vulnerable libraries** - Known vulnerabilities (Snyk/npm audit)
- [ ] **Password paste allowed** - Don't prevent paste in password fields
- [ ] **Notification permission on load** - Don't request immediately

#### Media & Images
- [ ] **Image aspect ratio** - Correct width/height attributes
- [ ] **Unsized images** - Images have explicit dimensions
- [ ] **Offscreen images** - Lazy load below-fold images

#### Network & Protocol
- [ ] **HTTPS redirect** - HTTP redirects to HTTPS
- [ ] **HTTP/2** - Using modern protocol
- [ ] **Valid source maps** - Source maps are accessible

#### Modern Web
- [ ] **Avoids application cache** - Deprecated AppCache
- [ ] **Avoids WebSQL** - Deprecated database
- [ ] **Avoids Mutation Events** - Deprecated DOM events

---

## PWA Gaps

### Currently Implemented (7 checks)

- [x] Web App Manifest link
- [x] Manifest required fields (name, short_name, start_url, display)
- [x] Manifest icons (192x192, 512x512)
- [x] Service Worker registration
- [x] HTTPS (required for PWA)
- [x] Viewport meta tag
- [x] Apple touch icon

### Missing PWA Audits

#### Installability
- [ ] **Installable** - Meets all installability criteria
- [ ] **Splash screen configured** - Background color + theme color
- [ ] **Maskable icon** - Adaptive icon for Android

#### Offline Experience
- [ ] **Works offline** - Returns 200 when offline
- [ ] **Offline fallback** - Custom offline page
- [ ] **Network reliability** - Responds quickly when offline

#### Content
- [ ] **Content width** - Viewport width matches device
- [ ] **Themed address bar** - theme-color meta tag

---

## Feature Gaps (Non-Audit)

| Feature | Lighthouse | WatchDog | Priority |
|---------|------------|----------|----------|
| **Treemap visualization** | Bundle size treemap | Missing | Medium |
| **Filmstrip view** | Page load filmstrip | Missing | Low |
| **Network waterfall** | Request timeline | Missing | Medium |
| **Stack packs** | Framework-specific advice | Missing | Low |
| **CI/CD integration** | Lighthouse CI | Missing | High |
| **Performance budgets** | Budget thresholds | Missing | Medium |
| **Historical comparison** | Score trends over time | Missing | Medium |
| **Throttling options** | CPU/Network throttling | Missing | Medium |
| **Device emulation** | Mobile viewport simulation | Missing | Low |

---

## Implementation Priority

### Phase 1: Core Web Vitals (High Priority) ✅ COMPLETED

1. **CLS (Cumulative Layout Shift)** ✅
   - Uses `PerformanceObserver` with `layout-shift` entry type
   - Calculates cumulative score
   - Identifies shifting elements with selectors

2. **INP (Interaction to Next Paint)** ✅
   - Monitors click, keydown, pointerdown events
   - Tracks event processing times
   - Reports worst interaction with details

3. **TBT (Total Blocking Time)** ✅
   - Uses `PerformanceObserver` with `longtask` entry type
   - Calculates total blocking time (duration - 50ms for each task)
   - Reports individual long tasks

4. **Expanded axe-core rules** ✅
   - Added 20 new rules (15 → 35 total)
   - Includes fix templates for all rules
   - WCAG criteria mappings complete

### Phase 2: Best Practices (High Priority) ✅ COMPLETED

4. **Console Error Detection** ✅
   - Early injection via MAIN world content script
   - Captures console.error, console.warn, unhandled errors, and promise rejections
   - Reports count and sample messages

5. **Vulnerable Libraries Detection** ✅
   - Detects 10 common libraries via window globals
   - Tracks 8 known CVEs for jQuery, Lodash, Moment, Angular, Bootstrap
   - Reports CVE details and fix versions

6. **Additional Best Practices** ✅
   - Password paste prevention detection
   - Notification permission on load
   - Unsized images (causes CLS)
   - Incorrect image aspect ratios

### Phase 3: Advanced Performance & SEO (Medium Priority)

9. **Image optimization**
   - Check image formats (suggest WebP/AVIF)
   - Compare to display size (detect oversized)
   - Suggest modern formats

10. **Cache policy analysis**
    - Check Cache-Control headers
    - Identify uncached resources
    - Suggest optimal TTL

11. **Tap target sizing**
    - Measure touch target dimensions
    - Report undersized targets (<48x48px)

12. **Font size legibility**
    - Check computed font sizes
    - Report illegible text (<12px)

13. **Crawlable links**
    - Detect JavaScript-only links
    - Verify href attributes

### Phase 5: Enterprise Features (Lower Priority)

14. **CI/CD integration**
    - CLI tool for automation
    - JSON output for parsing
    - Exit codes for thresholds

15. **Performance budgets**
    - Configure size limits
    - Set timing thresholds
    - Alert on violations

16. **Historical comparison**
    - Store scan results
    - Compare over time
    - Show trend charts

---

## Technical Implementation Notes

### Adding CLS Measurement

```typescript
// In performance scanner
function measureCLS(): Promise<number> {
  return new Promise((resolve) => {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Resolve after page is likely stable
    setTimeout(() => {
      observer.disconnect();
      resolve(clsValue);
    }, 5000);
  });
}
```

### Adding INP with web-vitals

```typescript
import { onINP } from 'web-vitals';

function measureINP(): Promise<number> {
  return new Promise((resolve) => {
    onINP((metric) => {
      resolve(metric.value);
    }, { reportAllChanges: true });
  });
}
```

### Console Error Detection

```typescript
// Inject into page context
const originalError = console.error;
const errors: string[] = [];

console.error = (...args) => {
  errors.push(args.map(String).join(' '));
  originalError.apply(console, args);
};

// Report errors in scan result
```

---

## References

- [Lighthouse Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [Web Vitals](https://web.dev/vitals/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Lighthouse Audits](https://developer.chrome.com/docs/lighthouse/overview/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
