# WatchDog 🐕

> Instant accessibility audits with visual highlighting - A browser extension that helps developers identify and fix accessibility issues.

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

---

## Features

### Core Functionality ✨

- **One-Click Scanning** - Audit any webpage instantly using industry-standard axe-core
- **Side Panel UI** - Clean, non-intrusive interface that opens alongside your page
- **Visual Highlighting** - Click any issue to highlight the problematic element on the page
- **Interactive Detection** - Click elements on the page to see their accessibility issues
- **15 Curated Rules** - Focused on high-impact WCAG violations (A, AA, AAA)
- **Code Fix Suggestions** - Get actionable code examples to fix each issue
- **Severity Filtering** - Filter by Critical, Serious, or Moderate issues
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
git clone https://github.com/your-username/watchdog.git
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
   - Or use keyboard shortcut (if configured)

2. **Scan a Page**
   - Click the "Scan Page" button in the side panel
   - Wait a few seconds for analysis to complete

3. **Review Issues**
   - View issues grouped by severity (Critical, Serious, Moderate)
   - Filter by category (Images, Forms, ARIA, etc.)
   - Click any issue card to see detailed information

4. **Inspect Elements**
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

### 15 High-Impact Accessibility Rules

| Category | Rules |
|----------|-------|
| **Images** | Alt text for images |
| **Interactive Elements** | Button and link accessible names |
| **Forms** | Input labels and form accessibility |
| **Color & Contrast** | Text contrast ratios (WCAG AA/AAA) |
| **Document Structure** | Page language, title, headings hierarchy |
| **Landmarks** | Proper use of semantic regions |
| **ARIA** | Valid attributes, required properties, proper roles |
| **Navigation** | Tabindex usage, focus management |
| **Technical** | Unique IDs, viewport settings |

All rules map to specific WCAG 2.1 criteria (Level A, AA, or AAA).

---

## Permissions Explained

WatchDog requires the following permissions:

- **activeTab** - Access the current tab to scan for accessibility issues
- **storage** - Save your settings and preferences
- **sidePanel** - Display the results panel alongside web pages
- **scripting** - Inject scanning and highlighting code into pages

**Privacy Note:** WatchDog processes everything locally in your browser. No data is sent to external servers. See [PRIVACY.md](PRIVACY.md) for details.

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
├── content/           # Content scripts (scanner, overlay, filters)
├── sidepanel/         # React UI (components, hooks, store)
├── popup/             # Extension popup
└── shared/            # Shared types, constants, utilities
```

### Available Commands

```bash
npm run dev              # Start dev server with HMR
npm run build            # Production build
npm run typecheck        # TypeScript type checking
npm test                 # Run tests with coverage
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run all              # Run format, lint, build, and test
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

### v1.2 (Planned)
- Real-time monitoring mode
- Historical scan comparison
- Accessibility score calculation
- Custom rule configuration

### Future Enhancements
- CI/CD integration guide
- Keyboard shortcuts
- Issue annotations ("mark as false positive")
- Integration with design tools (Figma, Sketch)
- Mobile responsive testing mode

See [docs/watchdogfinal-plan.md](docs/watchdogfinal-plan.md) for the complete roadmap.

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

- **Issues:** [GitHub Issues](https://github.com/your-username/watchdog/issues)
- **Documentation:** [docs/](docs/)
- **Privacy Policy:** [PRIVACY.md](PRIVACY.md)

---

**Built with ❤️ to make the web more accessible for everyone.**
