# WatchDog - Technical Documentation

> A browser extension that helps developers identify and fix accessibility issues with a clean side panel UI and visual highlighting.

**For project progress tracking, see:** [PROJECT_TRACKER.md](./PROJECT_TRACKER.md)

---

## Architecture Overview

| Decision | Choice | Rationale |
|----------|--------|-----------|
| MVP Rules | 15 curated rules | Focus on high-impact issues |
| Audit Coverage | Multi-type (Accessibility + 9 more planned) | Comprehensive web quality tool |
| UI Approach | Side panel + element highlighting | Non-intrusive, professional workflow |
| Component Library | shadcn/ui (Radix UI + Tailwind) | Accessible, customizable, modern |
| Rule Engine | Hybrid (axe-core + custom UI) | Industry-standard detection + custom UX |
| State Management | Zustand | Lightweight, TypeScript-friendly |
| Styling | Tailwind CSS v4 | Utility-first, modern design system |
| Testing | Vitest + React Testing Library | Fast, modern, well-integrated |

---

## Table of Contents

1. [Feature Set](#feature-set)
2. [The 15 MVP Rules](#the-15-mvp-rules)
3. [Technical Architecture](#technical-architecture)
4. [shadcn/ui Components](#shadcnui-components)
5. [Project Structure](#project-structure)
6. [Planned Audit Types](#planned-audit-types)
7. [Future Enhancements & Roadmap](#future-enhancements--roadmap)
8. [Commands & Quick Reference](#commands--quick-reference)

---

## Feature Set

### What's IN MVP ✅

- Side panel UI (opens alongside the page)
- shadcn/ui component library for polished, accessible UI
- One-click page scan using axe-core
- 15 curated accessibility rules
- Issue list with severity filtering
- Element highlighting on the page
- Issue detail view with WCAG info
- Code fix suggestions
- Click issue → highlight element
- Click element → show issues
- Badge with issue count
- Basic settings (WCAG level)
- Dark mode support

### What's IN v1.1 ✅ (Newly Added)

- Vision simulators (colorblind + blur modes)
- Focus order visualization
- Report export (PDF, JSON, CSV, HTML)

### What's NOT Yet Implemented ❌

- Real-time monitoring (v1.2)
- History/comparison (v1.2)

---

## The 15 MVP Rules

Using axe-core rule IDs with custom severity mapping:

| # | Rule ID | Name | Severity | WCAG |
|---|---------|------|----------|------|
| 1 | `image-alt` | Images must have alt text | Critical | 1.1.1 A |
| 2 | `button-name` | Buttons must have accessible name | Critical | 4.1.2 A |
| 3 | `link-name` | Links must have discernible text | Critical | 4.1.2 A |
| 4 | `color-contrast` | Text must meet contrast ratio | Serious | 1.4.3 AA |
| 5 | `label` | Form inputs must have labels | Critical | 1.3.1 A |
| 6 | `html-has-lang` | Page must have lang attribute | Serious | 3.1.1 A |
| 7 | `document-title` | Page must have a title | Serious | 2.4.2 A |
| 8 | `heading-order` | Headings must be in logical order | Moderate | 1.3.1 A |
| 9 | `region` | Content must be in landmark regions | Moderate | 1.3.1 A |
| 10 | `aria-valid-attr` | ARIA attributes must be valid | Critical | 4.1.2 A |
| 11 | `aria-required-attr` | Required ARIA attributes must exist | Critical | 4.1.2 A |
| 12 | `aria-roles` | ARIA roles must be valid | Critical | 4.1.2 A |
| 13 | `meta-viewport` | Zoom must not be disabled | Serious | 1.4.4 AA |
| 14 | `tabindex` | tabindex should not be > 0 | Moderate | 2.4.3 A |
| 15 | `duplicate-id` | IDs must be unique | Serious | 4.1.1 A |

### Rule Categories

```
Images (1 rule):      image-alt
Interactive (2):      button-name, link-name  
Forms (1):            label
Color (1):            color-contrast
Document (3):         html-has-lang, document-title, meta-viewport
Structure (2):        heading-order, region
ARIA (3):             aria-valid-attr, aria-required-attr, aria-roles
Technical (2):        tabindex, duplicate-id
```

---

## Technical Architecture

### Extension Components

**Four Main Parts:**
1. **Popup** - Quick toggle to open side panel
2. **Side Panel (React)** - Main UI with issue list, details, settings
3. **Background Service Worker** - Badge updates, storage management, message routing
4. **Content Script** - Runs axe-core, manages element highlighting overlay

**Message Flow:**
- Side Panel → Content Script: `SCAN`, `HIGHLIGHT`, `TOGGLE_VISION_FILTER`, `TOGGLE_FOCUS_ORDER`
- Content Script → Side Panel: Scan results, element interaction events
- Background Worker: Coordinates messaging, updates badge count

---

## shadcn/ui Components

### Key Components Used

| Feature | shadcn Component | Usage |
|---------|------------------|-------|
| Scan button | `Button` | Primary action with loading state |
| Severity cards | `Card` | Summary statistics display |
| Filter tabs | `Tabs` | Switch between severity levels |
| Issue list | `ScrollArea` | Scrollable list of issues |
| Issue cards | `Card` + `Badge` | Individual issue display |
| Settings toggles | `Switch` | WCAG level selection |
| Notifications | `Toast` | Success/error messages |
| Loading states | `Skeleton` | Content placeholders |
| Export menu | `DropdownMenu` | Report export options |

**Setup:** Uses `next-themes` pattern for dark mode, CSS variables for theming. All components are fully accessible (Radix UI primitives).

---

## axe-core Integration

**Hybrid Approach:** Use axe-core for rule detection (industry-standard, accurate), build custom UI/UX and fix suggestions.

**Scanner (`content/scanner.ts`):**
- Configures axe-core to run only our 15 rules using `runOnly` option
- Transforms axe results to custom Issue type with severity, category, WCAG mappings
- Generates unique selectors for element highlighting
- Performance tracked (scan duration)

**Fix Suggestions (`shared/fixes.ts`):**
- Custom templates for all 15 rules with code examples
- Contextual fixes based on element HTML
- Links to WCAG documentation and learning resources

---

## Project Structure

```
WatchDog/
├── src/
│   ├── manifest.json
│   │
│   ├── background/
│   │   ├── index.ts                 # Service worker entry
│   │   ├── badge.ts                 # Badge count management
│   │   └── storage.ts               # Chrome storage helpers
│   │
│   ├── content/
│   │   ├── index.ts                 # Content script entry
│   │   ├── scanner.ts               # axe-core integration
│   │   ├── overlay.ts               # Highlight management
│   │   ├── element-selector.ts      # Generate unique selectors
│   │   └── styles.css               # Injected highlight styles
│   │
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── main.tsx                 # React entry
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   └── ...              # Other shadcn components
│   │   │   ├── Header.tsx
│   │   │   ├── ScanButton.tsx       # Uses shadcn Button
│   │   │   ├── Summary.tsx          # Severity breakdown with shadcn Cards
│   │   │   ├── FilterBar.tsx        # Category filter with shadcn Tabs
│   │   │   ├── IssueList.tsx        # Uses shadcn ScrollArea
│   │   │   ├── IssueCard.tsx        # Uses shadcn Card + Badge
│   │   │   ├── IssueDetail.tsx      # Full issue view
│   │   │   ├── CodeBlock.tsx        # Syntax highlighted code
│   │   │   ├── EmptyState.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useScanner.ts        # Scan orchestration
│   │   │   ├── useIssues.ts         # Issue state & filtering
│   │   │   ├── useHighlight.ts      # Highlight commands
│   │   │   └── useSettings.ts
│   │   ├── store/
│   │   │   └── index.ts             # Zustand store
│   │   └── lib/
│   │       └── utils.ts             # shadcn cn() utility
│   │
│   ├── popup/
│   │   ├── index.html
│   │   └── Popup.tsx                # Simple "Open Panel" button
│   │
│   └── shared/
│       ├── types.ts                 # TypeScript interfaces
│       ├── constants.ts             # Rule IDs, severity levels
│       ├── fixes.ts                 # Fix suggestion templates
│       ├── wcag.ts                  # WCAG criteria data
│       └── messaging.ts             # Type-safe message helpers
│
├── public/
│   └── icons/
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       └── icon-128.png
│
├── tests/
│   ├── scanner.test.ts
│   ├── overlay.test.ts
│   └── fixtures/
│       └── test-page.html
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── components.json              # shadcn/ui configuration
├── postcss.config.js
└── README.md
```

**manifest.json:** MV3, permissions: `activeTab`, `storage`, `sidePanel`. Content script runs on `<all_urls>` at `document_idle`.

---

## v1.1 Features (Completed)

### Vision Simulators
- **Colorblind modes:** Protanopia, Deuteranopia, Tritanopia, Achromatopsia
- **Blur simulation:** Low (20/40), Medium (20/70), High (20/200) vision acuity
- Implementation: SVG color matrix filters in `src/content/vision-filters.ts`

### Focus Order Visualization
- Numbered blue badges on focusable elements showing tab order
- Respects custom tabindex values
- Dynamic position updates on scroll/resize
- Implementation: `src/content/focus-order.ts`

### Report Export
- **Formats:** PDF (with screenshot), JSON (CI/CD), CSV (spreadsheet), HTML (standalone)
- Dropdown menu in header with format descriptions
- Implementation: `src/sidepanel/lib/export.ts`

---

## Planned Audit Types

WatchDog currently focuses on accessibility auditing with 15 curated WCAG rules. The roadmap includes expanding into a **comprehensive web quality auditing tool** with multiple audit categories. This positions WatchDog to compete with tools like Lighthouse while maintaining our developer-friendly, extension-based approach.

### 1. SEO Audit ⭐ (v1.2 Priority)

**What we'll check:**
- **Meta Tags:** Title, description, keywords, viewport, charset
- **Social Media:** Open Graph and Twitter Card tags
- **Heading Structure:** H1 uniqueness, proper hierarchy (H1 → H2 → H3)
- **Canonical URLs:** Duplicate content prevention
- **Structured Data:** Schema.org markup validation (JSON-LD)
- **Robots & Crawling:** robots.txt, meta robots, sitemap.xml presence
- **Image SEO:** Alt text (already covered!), descriptive file names
- **Internal Links:** Broken links, anchor text quality
- **Mobile-Friendliness:** Responsive design validation
- **HTTPS Status:** Secure connection check

**Severity Levels:** Critical, High, Medium, Low
**Estimated Rules:** ~20 checks
**Implementation:** Custom DOM checkers + meta tag parsing

---

### 2. Performance Audit ⭐ (v1.2 Priority)

**What we'll check:**
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- **Loading Metrics:**
  - Time to First Byte (TTFB)
  - First Contentful Paint (FCP)
  - Time to Interactive (TTI)
- **Resource Analysis:**
  - Large JavaScript bundles (> 500KB warning)
  - Unoptimized images (missing WebP/AVIF)
  - Unused CSS/JS detection
  - Render-blocking resources
- **Network Optimization:**
  - Missing compression (gzip/brotli)
  - Cache headers validation
  - Excessive HTTP requests

**Target Metrics:** Based on Google's performance thresholds
**Integration:** `web-vitals` npm package + Chrome DevTools Protocol
**Estimated Rules:** ~12 metrics

---

### 3. Security Audit 🔒 (v1.3)

**What we'll check:**
- **HTTPS:** SSL/TLS certificate validity
- **Mixed Content:** HTTP resources on HTTPS pages
- **Security Headers:**
  - Content-Security-Policy (CSP)
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME sniffing)
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy
- **Vulnerabilities:**
  - Inline scripts (XSS risk indicators)
  - Deprecated/insecure APIs
  - Third-party script risks
- **Cookie Security:** Secure, HttpOnly, SameSite flags

**Severity:** Critical for missing security headers
**Estimated Rules:** ~12 checks
**Implementation:** Response header analysis

---

### 4. Best Practices Audit ✅ (v1.3)

**What we'll check:**
- **HTML Validity:** W3C markup validation
- **Deprecated Elements:** `<font>`, `<center>`, `align=""` attributes
- **Console Errors:** JavaScript errors and warnings
- **Network Errors:** Failed requests (404, 500 status codes)
- **Anti-Patterns:**
  - Geolocation requests on page load
  - Notification permission prompts on load
- **Document Mode:** Quirks mode detection
- **Character Encoding:** UTF-8 validation

**Severity:** Warning to Medium
**Estimated Rules:** ~15 checks
**Implementation:** `html-validate` or W3C Validator API

---

### 5. PWA (Progressive Web App) Audit 📱 (v1.4)

**What we'll check:**
- **Manifest.json:** Presence and validity
- **Service Worker:** Registration and functionality
- **Installability:** Add to home screen criteria
- **Offline Support:** Offline fallback page
- **App Icons:** Multiple sizes (192px, 512px)
- **Theme Color:** Consistent branding
- **Start URL:** Properly configured
- **Display Mode:** Standalone/fullscreen

**Format:** Pass/Fail binary checks
**Estimated Rules:** ~7 checks
**Implementation:** Manifest parser + service worker detection

---

### 6. Mobile Responsiveness Audit 📱 (v1.3)

**What we'll check:**
- **Viewport Meta Tag:** Properly configured
- **Touch Target Size:** Minimum 48x48px tap targets
- **Font Sizes:** Readable without zoom (16px minimum)
- **Content Width:** No horizontal scrolling
- **Tap Delay:** `touch-action` CSS property
- **Media Queries:** Breakpoints for common devices (320px, 768px, 1024px)
- **Orientation Support:** Both portrait and landscape

**Device Testing:** Common viewport sizes
**Estimated Rules:** ~10 checks
**Implementation:** Computed style analysis + viewport simulation

---

### 7. Link Quality Audit 🔗 (v1.4)

**What we'll check:**
- **Broken Links:** 404 errors (internal & external)
- **Redirect Chains:** Multiple 301/302 redirects
- **External Link Security:** nofollow/noopener attributes
- **Download Links:** File type indicators
- **Email/Phone Links:** `mailto:` and `tel:` validation
- **Hash Links:** Anchor targets exist
- **Link Text Quality:** Avoid generic "click here"

**Async Checking:** May require external requests
**Estimated Rules:** ~8 checks
**Implementation:** `broken-link-checker` or custom crawler

---

### 8. Content Quality Audit 📝 (v2.0)

**What we'll check:**
- **Readability Score:** Flesch-Kincaid grade level
- **Word Count:** Minimum content thresholds
- **Duplicate Content:** Similar page detection
- **Grammar/Spelling:** Basic validation
- **Keyword Density:** SEO relevance checks
- **Media-to-Text Ratio:** Balance analysis

**Lower Priority:** Nice-to-have features
**Estimated Rules:** ~6 checks
**Implementation:** Natural language processing libraries

---

### 9. Internationalization (i18n) Audit 🌍 (v2.0)

**What we'll check:**
- **Language Tags:** `lang` and `hreflang` attributes
- **Character Encoding:** UTF-8 support validation
- **Text Direction:** RTL language support (`dir` attribute)
- **Date/Time Formats:** Locale-appropriate formatting
- **Currency Formatting:** Proper symbols and placement
- **Translation Completeness:** Missing translation detection

**Target Users:** Global/multilingual websites
**Estimated Rules:** ~8 checks
**Implementation:** DOM attribute analysis + locale detection

---

### 10. Privacy & Compliance Audit 🔐 (v1.4)

**What we'll check:**
- **Cookie Consent:** GDPR/CCPA banner presence
- **Privacy Policy:** Link accessible and valid
- **Terms of Service:** Present and properly linked
- **Third-Party Tracking:** Google Analytics, Facebook Pixel detection
- **Data Collection Forms:** Privacy notices on forms
- **Cookie Classification:** First-party vs. third-party
- **Do Not Track:** Header respect

**Regulatory Focus:** Legal compliance requirements
**Estimated Rules:** ~10 checks
**Implementation:** Cookie analysis + DOM scanning

---

## Multi-Audit UI Design

### UI Implementation Options

**Option 1: Tabbed Interface**
```
[ Accessibility ] [ SEO ] [ Performance ] [ Security ] [ Best Practices ] [ More ▼ ]
```
Separate tab for each audit type with independent results.

**Option 2: Multi-Select Scan**
```
☑ Accessibility (15 rules)
☑ SEO (20 checks)
☑ Performance (12 metrics)
☐ Security (12 checks)
☐ Best Practices (15 checks)

[Scan Selected Audits]
```
Users choose which audits to run before scanning.

**Option 3: Lighthouse-Style Dashboard**
```
🎯 Overall Score: 85/100

Accessibility:    92/100 ✅
SEO:              88/100 ✅
Performance:      74/100 ⚠️
Security:        100/100 ✅
Best Practices:   81/100 ⚠️
```
Unified scoring system with color-coded results.

### Suggested Implementation Libraries

| Audit Type | Library/Tool | Notes |
|------------|--------------|-------|
| SEO | Custom checkers | DOM parsing + meta tag validation |
| Performance | `web-vitals` | Official Google library |
| Security | Custom analysis | Response header inspection |
| Best Practices | `html-validate` | W3C-compliant validator |
| PWA | Manifest parser | JSON validation + SW detection |
| Links | `broken-link-checker` | Async link validation |
| Full Integration | `lighthouse` | Complete Lighthouse integration option |

### Type System Updates

```typescript
// Extend audit types beyond accessibility
export type AuditType =
  | 'accessibility'
  | 'seo'
  | 'performance'
  | 'security'
  | 'best-practices'
  | 'pwa'
  | 'mobile'
  | 'links'
  | 'content'
  | 'i18n'
  | 'privacy';

// Unified scan result structure
export interface MultiAuditResult {
  url: string;
  timestamp: number;
  audits: {
    accessibility?: AccessibilityAudit;
    seo?: SEOAudit;
    performance?: PerformanceAudit;
    security?: SecurityAudit;
    // ... other audit types
  };
  overallScore: number; // 0-100 composite score
  summary: MultiAuditSummary;
}
```

---

## Phased Rollout Strategy

### Phase 1 (v1.2) - High-Demand Audits
- ✅ **SEO Audit** - Most requested by developers
- ✅ **Performance Audit** - Core Web Vitals are critical for rankings
- **Timeline:** Q2 2026
- **Effort:** ~4 weeks development

### Phase 2 (v1.3) - Security & Standards
- 🔒 **Security Audit** - Essential for production sites
- ✅ **Best Practices** - Easy wins for developers
- 📱 **Mobile Responsiveness** - Mobile-first web
- **Timeline:** Q3 2026
- **Effort:** ~3 weeks development

### Phase 3 (v1.4) - Modern Web Features
- 📱 **PWA Audit** - Growing adoption trend
- 🔗 **Link Quality** - High utility for large sites
- 🔐 **Privacy/Compliance** - Legal requirements
- **Timeline:** Q4 2026
- **Effort:** ~2 weeks development

### Phase 4 (v2.0) - Advanced Features
- 📝 **Content Quality** - Nice-to-have
- 🌍 **Internationalization** - For global sites
- **Timeline:** 2027
- **Effort:** ~3 weeks development

---

## Future Enhancements & Roadmap

### v1.2 (Planned)
- Historical scan comparison
- Real-time monitoring mode

### Testing & Quality Enhancements
- **Keyboard navigation testing** - Automated detection of keyboard traps
- **Screen reader testing hints** - Suggestions for manual screen reader verification
- **Animation/motion testing** - Detect animations that could trigger vestibular issues
- **Touch target sizing** - Mobile accessibility validation (min 44x44px touch targets)

### Developer Experience
- **Inline code fixes** - One-click apply fixes directly to the page (temporary)
- **Custom rule configuration** - Let users add/disable specific rules
- **Issue annotations** - "Mark as false positive" or "Snooze" functionality
- **Accessibility score** - Overall page score/grade (0-100)
- **CI/CD integration guide** - JSON export → GitHub Actions workflow examples

### Reporting & Collaboration
- **Shareable reports** - Generate public URLs for report sharing
- **Issue comments/notes** - Add context to specific issues for team collaboration
- **Progress tracking** - Track issue resolution over time per domain
- **WCAG compliance dashboard** - Visual breakdown of A/AA/AAA compliance

### Advanced Detection Rules
- **Keyboard focus indicators** - Detect missing or insufficient focus styles
- **Language detection** - Auto-detect content language mismatches
- **Form validation patterns** - Check for accessible error messaging
- **Table accessibility** - Detect data tables missing proper markup
- **Live region detection** - Identify dynamic content needing ARIA live regions

### UX Improvements
- **Onboarding tour** - First-time user guidance
- **Quick filters** - "Show only fixable issues" or "High priority only"
- **Element inspector mode** - Hover over page elements to see accessibility info
- **Bulk actions** - Copy all issues, export filtered results
- **Keyboard shortcuts** - Quick scan (Cmd+Shift+A), navigate issues, etc.

### Integration Opportunities
- **Design tool integration** - Import Figma/Sketch URLs for design QA
- **Issue tracker export** - Direct export to Jira/Linear/GitHub Issues
- **Browser DevTools integration** - Show issues in Chrome DevTools panel
- **Learning resources** - Context-sensitive tutorials based on detected issues

### Mobile & Responsive
- **Responsive testing mode** - Test at different viewport sizes
- **Mobile-specific rules** - Touch targets, viewport zoom, orientation handling

---

## Commands & Quick Reference

### Development
```bash
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm test                 # Run unit tests with coverage (24 tests passing)
npm run lint             # ESLint check
npm run typecheck        # TypeScript type checking
npm run all              # Format, lint, build, and test
```

### Chrome Extension Loading
1. `npm run build` → 2. Open `chrome://extensions` → 3. Enable "Developer mode" → 4. Click "Load unpacked" → 5. Select `dist` folder

### Key Files

| File | Purpose |
|------|---------|
| `src/content/scanner.ts` | axe-core integration and scanning logic |
| `src/content/overlay.ts` | Element highlighting system |
| `src/content/focus-order.ts` | Focus order visualization |
| `src/content/vision-filters.ts` | Colorblind and blur simulators |
| `src/sidepanel/store/index.ts` | Zustand state management |
| `src/sidepanel/lib/export.ts` | Report export utilities (PDF, JSON, CSV, HTML) |
| `src/shared/types.ts` | TypeScript interfaces and types |
| `src/shared/constants.ts` | Rules, categories, WCAG mappings |

---

## Additional Documentation

- **[PROJECT_TRACKER.md](./PROJECT_TRACKER.md)** - Progress tracking and task completion status
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide and checklists

**Last Updated:** 2026-01-17
