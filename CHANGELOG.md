# watchdog

## 2.0.0 (2026-07-01)

### Major Changes

- **activeTab scan model (BREAKING)** — Scans are now triggered by clicking the toolbar icon, which grants Chrome's temporary `activeTab` access; all page interaction moved into the background service worker. The extension no longer declares **any** host permissions (removed the optional `<all_urls>`), so the install prompt shows no "read and change all your data" warning and no runtime host-permission prompt appears. The privacy policy now matches the code. Requires **Chrome 116+** (for `chrome.sidePanel.open`). Scans target the tab whose icon you click — switching tabs with the panel open means re-clicking the icon.

### Minor Changes

- **Redesigned exported reports** — The downloadable HTML and PDF reports were rebuilt to a professional standard with far richer data: an overall score gauge and letter grade, a plain-language verdict, a severity distribution bar, a by-category breakdown, and per-issue detail (standard, rule id, affected-element count, "why this matters", measured color-contrast swatches, axe's failure summary, code snippets, and "Learn more" links), plus a "Needs review" section. Both formats now use the real WatchDog logo and an identical hero.
- **Consistent dates** — Every date in the reports now renders in one format (e.g. `June 02, 2026`) instead of the locale default.

### Patch Changes

- **Content-script logging** — Overlay highlight logging routes through the dev-gated logger, so no `console` noise ships into scanned pages.

## 1.0.1 (2026-06-29)

### Patch Changes

- **Scanner accuracy fixes** — Corrected several audits so they report fewer false positives and more accurate results, including header detection that honors `<meta http-equiv>` policies and tightened SEO/Security/Best-Practices/PWA checks.
- **Scan resilience fixes** — Hardened the scanners against pages that throw, block requests, or change during a scan so a single failing check no longer aborts the whole audit, and the side panel recovers cleanly from failed scans.
- **Documentation reconciliation** — Updated `README.md` and `PRIVACY.md` to match the shipped code: documented the `scripting` permission and the `<all_urls>` content script (and the resulting "read and change all your data on all websites" warning), clarified that the Security and PWA audits make same-origin requests, corrected the storage/retention details (in-memory scan results, indefinitely persisted ignored issues, no stored theme preference), canonicalized repository links, and added a `LICENSE` file (ISC).

## 1.0.0 (2026-01-17)

### Major Changes

- **WatchDog v1.0.0 - Initial Release**

  🎉 **First public release of WatchDog** - A comprehensive web accessibility and performance audit tool for Chrome.

  ## 🚀 Core Features

  ### Multi-Type Audits
  - **Accessibility**: 35 axe-core rules with WCAG 2.1 Level A & AA compliance
  - **Performance**: Full Core Web Vitals measurement (LCP, FCP, TTFB, CLS, INP, TBT)
  - **SEO**: 9 comprehensive checks (title, meta description, Open Graph, structured data)
  - **Security**: 9 security categories (HTTPS, CSP, secure cookies, X-Frame-Options)
  - **Best Practices**: 17 checks including console error detection and vulnerable library scanning
  - **PWA**: 7 Progressive Web App checks (manifest, service worker, icons)

  ### Accessibility (35 Rules)
  - Image alt text (images, videos, audio, objects, SVGs)
  - Interactive elements (buttons, links, bypass blocks, focus management)
  - Forms (labels, autocomplete, select names, image button alt text)
  - Color contrast (WCAG AA/AAA)
  - Document structure (language, title, headings, viewport, frames)
  - Landmarks and semantic regions
  - ARIA attributes and roles
  - Navigation (tabindex, focus order, scrollable regions)
  - Tables (headers, scope, captions)
  - Lists and definition lists
  - Deprecated elements (marquee, blink)
  - Media accessibility (captions, descriptions, no autoplay)

  ### Performance (8 Metrics)
  - **Core Web Vitals**:
    - LCP (Largest Contentful Paint)
    - CLS (Cumulative Layout Shift) with shifting element identification
    - INP (Interaction to Next Paint) with worst interaction tracking
    - TBT (Total Blocking Time) with long task reporting
  - **Load Metrics**:
    - FCP (First Contentful Paint)
    - TTFB (Time to First Byte)
    - DOM Content Loaded
    - Page Load Time
  - Performance scoring with good/needs-improvement/poor thresholds
  - Detailed performance bottleneck identification

  ### Security & Best Practices
  - **Console Error Capture**: Early injection at document_start to catch all errors and warnings
  - **Vulnerable Library Detection**:
    - Detects 10 common libraries (jQuery, Lodash, Moment, Angular, Vue, React, Bootstrap, Backbone, Ember)
    - Tracks 8 known CVEs with severity ratings
    - Reports CVE details, affected versions, and fix recommendations
  - HTML validation (DOCTYPE, charset, deprecated elements)
  - Image validation (broken images, aspect ratios, sizing)
  - Security headers and HTTPS enforcement
  - Password paste prevention detection
  - Notification permission on load detection

  ### SEO & PWA
  - Meta tags (title, description, Open Graph, viewport)
  - Structured data (JSON-LD) detection
  - Canonical URLs and HTTPS validation
  - Web App Manifest validation
  - Service Worker registration check
  - Icon requirements (192x192, 512x512, Apple touch icon)

  ## 🎨 User Interface

  ### Side Panel Experience
  - Clean, non-intrusive side panel UI
  - Real-time issue scanning with progress indicators
  - Issue grouping by severity (Critical, Serious, Moderate, Minor)
  - Filter by category (Images, Forms, ARIA, Performance, etc.)
  - Search functionality across all issues

  ### Visual Features
  - **Element Highlighting**: Click any issue to highlight the problematic element on the page
  - **Interactive Detection**: Click elements on the page to see their accessibility issues
  - **Vision Simulators**:
    - Colorblindness simulation (Protanopia, Deuteranopia, Tritanopia, Achromatopsia)
    - Low vision blur simulation (Low, Medium, High)
  - **Focus Order Visualization**: See keyboard navigation order with numbered indicators
  - **Badge Counter**: Extension icon shows total issue count at a glance

  ### Code Fix Suggestions
  - Actionable code examples for every issue
  - WCAG criteria mappings with explanations
  - "Learn More" links to detailed documentation
  - Copy-to-clipboard functionality for quick fixes

  ### Report Export
  - **PDF**: Professional reports with screenshots
  - **JSON**: Machine-readable format for CI/CD integration
  - **CSV**: Spreadsheet format for tracking and analysis
  - **HTML**: Standalone reports for team sharing

  ## 🛠️ Technical Implementation

  ### Architecture
  - Built with React 19 + TypeScript
  - Vite bundler with @crxjs/vite-plugin for Chrome extension development
  - Zustand for state management
  - shadcn/ui components (Radix UI + Tailwind CSS v4)
  - axe-core for accessibility rule engine
  - Comprehensive test coverage with Vitest + React Testing Library

  ### Performance
  - Lazy loading of axe-core library
  - Efficient DOM scanning with targeted rule sets
  - Minimal memory footprint
  - Fast scan completion (<5 seconds for most pages)

  ### Privacy & Security
  - **100% Local Processing**: All data processed locally in the browser
  - **No Data Collection**: Zero telemetry, analytics, or data transmission
  - **Minimal Permissions**: Only 4 essential Chrome permissions
  - **Open Source**: Fully auditable codebase

  ## 📦 Project Structure
  - `src/background/`: Service worker for badge updates and messaging
  - `src/content/`: Content scripts for scanning and overlays
    - Individual scanners for each audit type
    - Console capture with early injection (MAIN world)
    - Vision filters and focus order visualization
  - `src/sidepanel/`: React UI components and state management
  - `src/shared/`: Shared types, constants, and utilities

  ## 🎯 Use Cases
  - **Developers**: Catch accessibility issues during development
  - **QA Teams**: Comprehensive testing across multiple dimensions
  - **Accessibility Auditors**: WCAG compliance validation
  - **Performance Engineers**: Core Web Vitals monitoring
  - **SEO Specialists**: On-page SEO validation

  ## 📊 Comparison to Lighthouse

  WatchDog provides comparable coverage to Google Lighthouse with:
  - 35 accessibility rules (vs. Lighthouse's ~40)
  - All Core Web Vitals metrics
  - Similar SEO and Best Practices coverage
  - Additional features: vision simulators, vulnerable library detection, real-time console monitoring

  ## 🔜 What's Next
  - v1.1: Image optimization analysis, mobile responsiveness testing
  - v2.0: CLI tool for CI/CD, performance budgets, historical comparison
