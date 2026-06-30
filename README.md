# WatchDog 🐕

> Instant accessibility audits with visual highlighting - A browser extension that helps developers identify and fix accessibility issues.

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.1-green.svg)](package.json)

---

## Features

### Core Functionality ✨

- **Multiple Audit Types** - Comprehensive audits for Accessibility, Performance, SEO, Security, Best Practices, and PWA
- **One-Click Scanning** - Audit any webpage instantly using industry-standard tools
- **Side Panel UI** - Clean, non-intrusive interface that opens alongside your page
- **Visual Highlighting** - Click any issue to highlight the problematic element on the page
- **Interactive Detection** - Click elements on the page to see their accessibility issues
- **35+ Accessibility Rules** - Comprehensive WCAG coverage (A, AA levels) using axe-core
- **Core Web Vitals** - Full performance metrics including LCP, FCP, TTFB, CLS, INP, and TBT
- **Code Fix Suggestions** - Get actionable code examples to fix each issue
- **Severity Filtering** - Filter by Critical, Serious, Moderate, or Minor issues
- **Badge Counter** - Extension icon shows total issue count at a glance

### Advanced Features 🎯

- **Vision Simulators** - Experience your site as users with colorblindness or low vision
  - Protanopia, Deuteranopia, Tritanopia, Achromatopsia
  - Low, Medium, High vision blur simulation
- **Focus Order Visualization** - See keyboard navigation order with numbered indicators
- **Report Export** - Generate reports in multiple formats
  - PDF with screenshots
  - JSON for CI/CD pipelines
  - CSV for spreadsheets
  - HTML standalone reports
- **Dark Mode** - Built-in theme support for comfortable viewing

---

## Installation

### For Users

#### Install from Chrome Web Store (Coming Soon)
1. Visit the [Chrome Web Store listing](#) (link coming soon)
2. Click "Add to Chrome"
3. Grant necessary permissions

#### Manual Installation (Development Build)
1. Download the latest release from [Releases](#)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions`
4. Enable "Developer mode" (toggle in top-right corner)
5. Click "Load unpacked"
6. Select the extracted `dist` folder

### For Developers

```bash
# Clone the repository
git clone https://github.com/hrithik-infinite/watchdog.git
cd watchdog

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run all checks (format, lint, build, test)
npm run all
```

---

## Usage Guide

### Getting Started

1. **Open the Extension**
   - Click the WatchDog icon in your Chrome toolbar
   - Or set a keyboard shortcut at `chrome://extensions/shortcuts` (WatchDog registers an "Activate the extension" command)

2. **Select Audit Type**
   - Choose from Accessibility, Performance, SEO, Security, Best Practices, or PWA
   - Or run all audits at once for a complete analysis

3. **Scan a Page**
   - Click the "Scan" button for your selected audit type
   - Wait a few seconds for analysis to complete

4. **Review Issues**
   - View issues grouped by severity (Critical, Serious, Moderate, Minor)
   - Filter by category (Images, Forms, ARIA, Performance, etc.)
   - Click any issue card to see detailed information

5. **Inspect Elements**
   - Click "Highlight" on an issue to show the element on the page
   - Click directly on page elements to see their issues in the panel

### Using Vision Simulators

1. Open the Settings panel
2. Navigate to "Vision Simulators"
3. Select a colorblind type or blur level
4. Toggle on/off to see the page through different visual perspectives

### Visualizing Focus Order

1. Open Settings
2. Enable "Focus Order Visualization"
3. See numbered badges on all focusable elements showing tab order
4. Identify navigation issues and unexpected tab sequences

### Exporting Reports

1. Click the export dropdown in the header
2. Choose your format:
   - **PDF** - Professional report with screenshots (best for presentations)
   - **JSON** - Machine-readable format (best for CI/CD integration)
   - **CSV** - Spreadsheet format (best for tracking/analysis)
   - **HTML** - Standalone webpage (best for sharing with team)

---

## What WatchDog Checks

### Comprehensive Audit Categories

WatchDog provides six types of audits to comprehensively analyze your website:

#### 1. Accessibility (35 Rules)

| Category | Rules |
|----------|-------|
| **Images** | Alt text for images, videos, audio, objects, and SVGs |
| **Interactive Elements** | Button and link accessible names, bypass blocks, focus management |
| **Forms** | Input labels, select names, autocomplete, and image button alt text |
| **Color & Contrast** | Text contrast ratios (WCAG AA/AAA) |
| **Document Structure** | Page language, title, headings hierarchy, meta viewport, frame titles |
| **Landmarks** | Proper use of semantic regions |
| **ARIA** | Valid attributes, required properties, proper roles |
| **Navigation** | Tabindex usage, focus order, scrollable regions |
| **Tables** | Header associations, scope attributes, captions |
| **Structure** | Lists, definition lists, nested interactive elements |
| **Deprecated** | Marquee and blink elements |
| **Media** | Video captions, audio descriptions, no autoplay |

All rules map to specific WCAG 2.1 criteria (Level A or AA).

#### 2. Performance (8 Metrics)

- **Core Web Vitals**: LCP, CLS, INP, TBT
- **Load Metrics**: FCP, TTFB, DOM Content Loaded, Page Load Time
- Identifies performance bottlenecks and provides optimization suggestions

#### 3. SEO (9 Checks)

- Page title, meta description, H1 heading
- Open Graph tags, canonical URL, structured data
- HTTPS protocol, viewport meta tag, image alt text

#### 4. Security (9 Categories)

- HTTPS enforcement, CSP headers, secure cookies
- X-Frame-Options, mixed content detection
- Security headers and protocol validation

#### 5. Best Practices (16 Checks)

- DOCTYPE, character encoding, language attributes
- Vulnerable libraries detection (jQuery, Lodash, Moment, Angular, Bootstrap, etc.)
- Deprecated HTML elements, broken images, duplicate IDs
- Password paste prevention, notification permissions
- Image sizing and aspect ratio issues

#### 6. PWA (7 Checks)

- Web App Manifest validation
- Service Worker registration
- Icon requirements (192x192, 512x512)
- Apple touch icon, HTTPS requirement

---

## Permissions Explained

WatchDog requests the following four permissions:

- **activeTab** - Access the current tab to scan for accessibility issues
- **storage** - Save your settings, preferences, and the list of issues you choose to ignore
- **sidePanel** - Display the results panel alongside web pages
- **scripting** - Inject the scanner and overlay code into the active tab **on demand** — only when you scan a page or toggle a vision/focus overlay

**No "all sites" warning:** WatchDog has **no static content script and no broad host permissions**, so it loads nothing on the pages you browse and Chrome does **not** show the "Read and change all your data on all websites" warning. The scanner is injected into a single tab only when you act on it (scan, or turn on a page overlay), under the `activeTab` grant, to read the DOM and draw highlights — page content is never transmitted anywhere. If you switch tabs with the panel open, scanning the new tab may ask you to click the WatchDog toolbar icon first to grant access to that tab.

**Privacy Note:** WatchDog processes everything locally in your browser and sends nothing to third-party servers. Some audits make _same-origin_ requests to the page you are scanning (the Security audit issues a `HEAD` request to read response headers; the PWA audit fetches the page's own web app manifest). See [PRIVACY.md](PRIVACY.md) for details.

---

## Development

### Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite with @crxjs/vite-plugin
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS v4)
- **State Management:** Zustand
- **Accessibility Engine:** axe-core
- **Testing:** Vitest + React Testing Library
- **Report Generation:** jsPDF, html2canvas

### Project Structure

```
src/
├── background/        # Service worker (badge, storage, messaging)
├── content/           # Content scripts
│   ├── scanner.ts                  # Main accessibility scanner
│   ├── performance-scanner.ts      # Performance metrics & Core Web Vitals
│   ├── seo-scanner.ts             # SEO audits
│   ├── security-scanner.ts        # Security checks
│   ├── best-practices-scanner.ts  # Best practices
│   ├── pwa-scanner.ts             # PWA manifest & service worker
│   ├── overlay.ts                 # Element highlighting
│   ├── vision-filters.ts          # Vision simulation filters
│   └── focus-order.ts             # Focus order visualization
├── sidepanel/         # React UI (components, hooks, store)
│   ├── components/    # UI components
│   └── store/         # Zustand state management
└── shared/            # Shared types, constants, utilities
    ├── types.ts       # TypeScript definitions
    ├── constants.ts   # Accessibility rules & mappings
    ├── fixes.ts       # Code fix templates
    ├── scoring.ts     # Audit scoring logic
    └── messaging.ts   # Chrome extension messaging
```

### Available Commands

```bash
npm run dev              # Start dev server with HMR
npm run build            # Production build (type-check + both bundles)
npm run lint             # Biome check (lint + format + imports), read-only
npm run fix              # Auto-fix lint/format/import issues
npm run typecheck        # TypeScript type checking
npm test                 # Run tests with coverage
npm run test:e2e         # Playwright extension E2E (installs Chromium + builds)
npm run all              # Full local gate: fix, typecheck, test, build
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## Troubleshooting

### Extension Not Working

- **Refresh the page** after installing the extension
- **Check console** for error messages (F12 → Console)
- **Reload extension** at `chrome://extensions`

### No Issues Detected

- Ensure the page has fully loaded before scanning
- Check if the page allows content scripts (some sites block extensions)
- Try scanning a different website to verify functionality

### Highlighting Not Working

- Make sure the element still exists on the page (dynamic content may have changed)
- Refresh the page and re-scan if issues persist

### Report Export Issues

- **PDF not generating?** Check browser console for errors
- **Large pages timing out?** Try exporting as JSON or CSV instead

---

## Roadmap

### v1.0 ✅ (Current - Released January 2026)
- 35 accessibility rules with WCAG 2.1 mapping
- Full Core Web Vitals measurement (CLS, INP, TBT)
- Complete Performance, SEO, Security, Best Practices, and PWA audits
- Vulnerable library detection
- Vision simulators and focus order visualization
- Multi-format report export (PDF, JSON, CSV, HTML)

### v1.1 (Next - February 2026)
- Image optimization analysis
- Cache policy audits
- Mobile responsiveness testing
- Tap target sizing validation
- Font legibility checks

### v2.0 (Future)
- CLI tool for CI/CD integration
- Performance budgets
- Historical scan comparison
- GitHub Actions integration
- Custom rule configuration

### Long-term Vision
- Real-time monitoring mode
- Team dashboard for multi-site tracking
- Integration with design tools (Figma, Sketch)
- API access for programmatic scanning

See [docs/implementation-roadmap.md](docs/implementation-roadmap.md) for the detailed implementation plan.

---

## Resources

### Learning About Accessibility

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11Y Project](https://www.a11yproject.com/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Related Tools

- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## License

ISC License - See [LICENSE](LICENSE) file for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/hrithik-infinite/watchdog/issues)
- **Documentation:** [docs/](docs/)
- **Privacy Policy:** [PRIVACY.md](PRIVACY.md)

---

**Built with ❤️ to make the web more accessible for everyone.**
