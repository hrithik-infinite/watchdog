# Privacy Policy for WatchDog

**Last Updated:** January 17, 2026

## Introduction

WatchDog is a browser extension designed to help developers identify and fix accessibility issues on web pages. We take your privacy seriously and are committed to protecting your data.

**Key Privacy Principle:** WatchDog processes all data locally in your browser. We do not collect, transmit, or store any personal information or browsing data on external servers.

---

## Information We Collect

### Data Processed Locally

WatchDog processes the following information **locally in your browser only**:

1. **Page Content**
   - HTML structure of pages you actively choose to scan
   - CSS styles and computed properties
   - ARIA attributes and accessibility metadata
   - Used solely for accessibility analysis

2. **User Settings**
   - Your preferred WCAG conformance level (A, AA, or AAA)
   - Theme preference (light/dark mode)
   - Vision simulator selections
   - Stored locally using Chrome's `storage.local` API

3. **Scan Results**
   - Accessibility issues detected on scanned pages
   - Temporarily cached during your browsing session
   - Automatically cleared when you close the browser

### Data We Do NOT Collect

- Personal information (name, email, address, etc.)
- Browsing history
- URLs of pages you visit or scan
- Cookies or tracking identifiers
- Login credentials
- Form data or user input
- Analytics or usage statistics
- IP addresses

---

## How We Use Information

### Local Processing Only

All data processing happens entirely within your browser:

1. **Multi-Type Audits**
   - When you run a scan, various audits analyze the page locally
   - Accessibility: axe-core library analyzes the DOM
   - Performance: Core Web Vitals metrics collected via browser APIs
   - SEO, Security, Best Practices, PWA: Page metadata and structure analyzed
   - Results are displayed in the side panel
   - No data leaves your device

2. **Element Highlighting**
   - Visual overlays are drawn directly on the page
   - Highlighting data is stored temporarily in memory
   - Cleared when you navigate away or close the tab

3. **Vision Simulators**
   - CSS filters applied directly to the page DOM
   - No screenshots or page data stored
   - Effects removed when you disable the simulator

4. **Report Export**
   - PDF, JSON, CSV, and HTML reports generated locally
   - Saved to your computer's download folder
   - You control where reports are stored and who has access

---

## Data Storage

### Local Storage Only

- **Chrome Storage API:** Used to save user preferences (WCAG level, theme)
- **Session Storage:** Temporarily stores scan results during active browsing
- **No External Databases:** We do not use any cloud storage or external servers

### Data Retention

- **User Settings:** Persist until you uninstall the extension or clear browser data
- **Scan Results:** Cleared when you close the browser or navigate away
- **Exported Reports:** Saved to your device only (you manage these files)

---

## Third-Party Services

### axe-core Library

WatchDog uses the open-source [axe-core](https://github.com/dequelabs/axe-core) library by Deque Systems for accessibility rule detection. This library:
- Runs entirely in your browser
- Does not transmit data externally
- Is used in compliance with its Mozilla Public License 2.0

### No External Connections

WatchDog does **not**:
- Make network requests to external servers
- Use third-party analytics (no Google Analytics, no telemetry)
- Connect to CDNs or remote resources at runtime
- Share data with advertisers or data brokers

---

## Permissions Explained

WatchDog requires the following Chrome permissions:

### activeTab
- **Purpose:** Access the current tab's content to perform accessibility scans
- **Scope:** Only when you actively click the extension icon and scan
- **Data Access:** Read-only access to page HTML, CSS, and DOM structure
- **No Background Access:** Cannot access tabs you're not actively scanning

### storage
- **Purpose:** Save your preferences and settings
- **Scope:** Stores data locally using Chrome's storage API
- **Data Stored:** WCAG level preference, theme settings, vision simulator state
- **No Remote Sync:** Data stays on your device (does not sync to Chrome account)

### sidePanel
- **Purpose:** Display the accessibility report panel alongside web pages
- **Scope:** UI component only, no data collection
- **Functionality:** Shows scan results and controls

---

## Your Rights and Controls

### Data Access

Since all data is stored locally on your device:
- You have complete control over your data
- No need to request data from us (it's already on your device)
- View settings at any time through the extension interface

### Data Deletion

To delete all WatchDog data:

1. **Clear Settings:**
   - Right-click extension icon → Manage Extension → Site Settings → Clear Data

2. **Uninstall Extension:**
   - Go to `chrome://extensions`
   - Click "Remove" on WatchDog
   - All stored preferences will be permanently deleted

3. **Clear Browser Data:**
   - Chrome Settings → Privacy and Security → Clear Browsing Data
   - Select "Cookies and other site data"
   - This removes all extension storage

### Opt-Out

Since WatchDog doesn't collect data or use tracking:
- No opt-out required for analytics (we don't use any)
- Simply don't scan pages if you don't want analysis
- Uninstall the extension to stop all data processing

---

## Children's Privacy

WatchDog does not knowingly collect information from children under 13. Since we don't collect any personal information at all, the extension is safe for use by developers of all ages.

---

## Changes to This Policy

We may update this privacy policy to reflect:
- Changes in browser APIs or permissions
- New features or functionality
- Legal or regulatory requirements

**Notification:** Material changes will be announced via:
- Extension update notes in the Chrome Web Store
- Notice in the extension's side panel
- Updated "Last Updated" date at the top of this document

---

## Security

### Local Processing Benefits

Processing data locally provides inherent security advantages:
- No data transmission vulnerabilities
- No server breaches or data leaks possible
- No man-in-the-middle attack surface
- Complete user control over data

### Best Practices

We follow secure development practices:
- Regular dependency updates
- Code reviews and security audits
- Minimal permission requests (only 4 essential permissions)
- TypeScript for type safety and compile-time checks
- Comprehensive testing with Vitest (unit and integration tests)
- Linting and formatting with ESLint and Prettier

---

## Compliance

### GDPR Compliance

WatchDog complies with GDPR principles:
- **Data Minimization:** We collect no personal data
- **Purpose Limitation:** Only processes data for accessibility analysis
- **Storage Limitation:** Data stored only as long as necessary
- **Data Subject Rights:** Users have full control (data stored locally)

### CCPA Compliance

Under CCPA:
- We do not "sell" personal information (we don't collect it)
- No data sharing with third parties
- Users can delete all data by uninstalling

---

## Contact Information

If you have questions about this privacy policy or WatchDog's privacy practices:

- **GitHub Issues:** [https://github.com/hrithik-infinite/watchdog/issues](https://github.com/hrithik-infinite/watchdog/issues)
- **GitHub Repository:** [https://github.com/hrithik-infinite/watchdog](https://github.com/hrithik-infinite/watchdog)

For security vulnerabilities, please report privately via [GitHub Security Advisories](https://github.com/hrithik-infinite/watchdog/security/advisories).

---

## Open Source Transparency

WatchDog is open-source software. You can:
- Review the complete source code on [GitHub](https://github.com/hrithik-infinite/watchdog)
- Verify that no data collection occurs
- Audit all functionality yourself
- Contribute to development

**Code is Truth:** Our privacy practices are verifiable through public source code.

---

## Summary

**TL;DR:**
- ✅ All processing happens locally in your browser
- ✅ No data sent to external servers
- ✅ No analytics or tracking
- ✅ No personal information collected
- ✅ You control all data (stored on your device only)
- ✅ Open-source and auditable

**Your privacy is not a feature - it's fundamental to how WatchDog works.**

---

*This privacy policy applies to WatchDog version 1.0.0 (Released January 2026) and later.*
