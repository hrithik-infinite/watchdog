# WatchDog - Final Project Plan

> A browser extension that helps developers identify and fix accessibility issues with a clean side panel UI and visual highlighting.

---

## Decisions Summary

| Decision | Choice |
|----------|--------|
| MVP Rules | 15 rules |
| UI Approach | Side panel + element highlighting |
| Component Library | shadcn/ui (Radix UI + Tailwind) |
| Vision Simulators | ✅ v1.1 COMPLETED |
| Focus Order Viz | ✅ v1.1 COMPLETED |
| Report Export | ✅ v1.1 COMPLETED |
| Rule Engine | Hybrid (axe-core + custom UI/overlays) |

---

## Table of Contents

1. [Task List Overview](#task-list-overview)
2. [MVP Feature Set](#mvp-feature-set)
3. [The 15 MVP Rules](#the-15-mvp-rules)
4. [Side Panel UI Design](#side-panel-ui-design)
5. [Technical Architecture](#technical-architecture)
6. [shadcn/ui Setup & Components](#shadcnui-setup--components)
7. [Hybrid axe-core Integration](#hybrid-axe-core-integration)
8. [Project Structure](#project-structure)
9. [Development Phases](#development-phases)
10. [v1.1 Roadmap](#v11-roadmap)

---

## Task List Overview

### 🚀 Project Setup & Configuration
- [x] Initialize project with Vite + CRXJS + React + TypeScript
- [x] Configure Tailwind CSS and PostCSS
- [x] Initialize shadcn/ui (`npx shadcn-ui@latest init`)
- [x] Install core shadcn components (Button, Card, Badge, Tabs, ScrollArea, etc.)
- [x] Set up ESLint and Prettier
- [x] Create project folder structure
- [x] Create manifest.json (MV3)
- [x] Set up git repository and initial commit

### 🎨 UI Foundation
- [x] Create theme provider for dark mode support
- [x] Set up Tailwind configuration with shadcn/ui variables
- [x] Create base layout components (Header, Footer)
- [x] Implement empty state components
- [x] Create loading skeleton components

### 🧩 Extension Components

**Popup**
- [x] Create popup HTML and entry point
- [x] Build "Open Side Panel" button UI
- [x] Implement side panel opening logic
- [x] Add extension icon and branding

**Side Panel**
- [x] Create side panel HTML and React entry point
- [x] Build Header component with settings button
- [x] Create ScanButton component with loading states
- [x] Build Summary component (severity breakdown cards)
- [x] Create FilterBar component with tabs
- [x] Build IssueList component with scroll area
- [x] Create IssueCard component
- [x] Build IssueDetail component (full issue view)
- [x] Create CodeBlock component with syntax highlighting
- [x] Build Settings panel component

**Background Service Worker**
- [x] Create background service worker entry point
- [x] Implement badge count management
- [x] Set up Chrome storage helpers
- [x] Create message routing system

**Content Script**
- [x] Create content script entry point
- [x] Set up message listener infrastructure
- [x] Implement element highlighting system
- [x] Create overlay manager
- [x] Build element selector utility
- [x] Add injected CSS for highlights

### 🔍 Scanner Implementation
- [x] Install and configure axe-core
- [x] Create scanner.ts with axe integration
- [x] Configure 15-rule filter
- [x] Implement result transformation to Issue type
- [x] Create severity mapping logic
- [x] Build category mapping
- [x] Add WCAG tag extraction
- [x] Implement scan result caching

### 🎯 Highlighting System
- [x] Create highlight style classes (critical, serious, moderate, minor)
- [x] Implement highlight injection on page
- [x] Build click issue → highlight element flow
- [x] Add hover issue → preview highlight
- [x] Implement click element → show issues
- [x] Create element badges on highlighted items
- [x] Add clear highlights functionality
- [x] Handle dynamic content and DOM changes

### 🛠️ Fix Suggestions
- [x] Create fix suggestion template system
- [x] Write fix templates for all 15 rules:
  - [x] image-alt
  - [x] button-name
  - [x] link-name
  - [x] color-contrast
  - [x] label
  - [x] html-has-lang
  - [x] document-title
  - [x] heading-order
  - [x] region
  - [x] aria-valid-attr
  - [x] aria-required-attr
  - [x] aria-roles
  - [x] meta-viewport
  - [x] tabindex
  - [x] duplicate-id
- [x] Add code syntax highlighting for fixes
- [x] Implement copy-to-clipboard functionality
- [x] Add "Learn More" links to WCAG documentation

### ⚙️ Settings & State Management
- [x] Set up Zustand store
- [x] Create useScanner hook
- [x] Build useIssues hook with filtering
- [x] Create useHighlight hook
- [x] Build useSettings hook
- [x] Implement WCAG level selection (A, AA, AAA)
- [x] Add dark mode toggle
- [x] Create settings persistence with Chrome storage

### 🧪 Testing & Quality
- [ ] Write scanner unit tests
- [ ] Create overlay manager tests
- [ ] Test on 20+ real websites
- [ ] Test with various WCAG violations
- [ ] Verify all 15 rules detect correctly
- [ ] Test highlighting on dynamic content
- [ ] Check memory usage and performance
- [ ] Test dark mode across all components
- [ ] Verify message passing between components
- [ ] Test edge cases and error handling

### 🎨 Polish & UX
- [x] Add smooth animations and transitions
- [x] Implement toast notifications for errors/success
- [x] Create proper loading states
- [x] Add keyboard navigation support
- [x] Optimize for performance
- [x] Add tooltips for better UX
- [x] Ensure responsive design in side panel
- [x] Add proper ARIA labels (dogfooding!)

### 📦 Build & Deploy
- [x] Test production build
- [x] Create extension icons (16, 32, 48, 128)
- [ ] Write README.md with usage instructions
- [ ] Create privacy policy
- [ ] Take screenshots for Chrome Web Store (1280x800)
- [ ] Create promotional images
- [ ] Write compelling store description
- [ ] Set up Chrome Web Store developer account
- [ ] Submit extension for review
- [ ] Monitor for review feedback

### ✅ v1.1 Features (COMPLETED)
- [x] Vision simulators (colorblind filters)
  - [x] Create vision-filters.ts with SVG color matrix filters
  - [x] Implement protanopia, deuteranopia, tritanopia, achromatopsia modes
  - [x] Add TOGGLE_VISION_FILTER message type
  - [x] Create separate dropdown in Settings UI
- [x] Blur simulation
  - [x] Implement blur-low, blur-medium, blur-high levels
  - [x] Add vision acuity descriptions (20/40, 20/70, 20/200)
  - [x] Create separate dropdown in Settings UI
- [x] Focus order visualization
  - [x] Create focus-order.ts with badge rendering
  - [x] Implement getFocusableElements with tabindex sorting
  - [x] Add numbered blue badges with positioning
  - [x] Handle scroll/resize updates
  - [x] Add toggle switch in Settings UI
- [x] Report export (PDF, JSON, CSV, HTML)
  - [x] Create export.ts utility functions
  - [x] Install jsPDF for PDF generation
  - [x] Implement JSON export for CI/CD
  - [x] Implement CSV export for spreadsheets
  - [x] Implement HTML export with professional styling
  - [x] Implement PDF export with screenshot capture
  - [x] Create ExportButton component with dropdown menu
  - [x] Add export button to Header component

### 🚧 v1.2 Features (Future)
- [ ] Historical scan comparison
- [ ] Real-time monitoring mode

---

## MVP Feature Set

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

## Side Panel UI Design

### Why Side Panel?

- Doesn't block page content
- More space for issue details
- Can see issues and page simultaneously
- Professional, app-like feel
- Native Chrome side panel API (MV3)

### Component Library

**shadcn/ui** - A collection of re-usable components built with Radix UI and Tailwind CSS
- Pre-built accessible components (Button, Card, Badge, Tabs, etc.)
- Consistent design system
- Fully customizable with Tailwind
- Already supports dark mode
- Excellent accessibility out of the box

### Panel Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   WEB PAGE CONTENT                              │  WatchDog SIDE PANEL       │
│                                                 │                               │
│   ┌─────────────────────────────────────────┐   │  ┌─────────────────────────┐  │
│   │                                         │   │  │ WatchDog      [⚙️]  │  │
│   │   ┌─────────────┐                       │   │  ├─────────────────────────┤  │
│   │   │    HERO     │ ← Highlighted         │   │  │                         │  │
│   │   │    IMAGE    │   (red border)        │   │  │ [🔍 Scan Page]          │  │
│   │   │             │                       │   │  │                         │  │
│   │   └─────────────┘                       │   │  │ ─────────────────────── │  │
│   │                                         │   │  │                         │  │
│   │   Welcome to Our Site                   │   │  │ 23 Issues Found         │  │
│   │   ───────────────────                   │   │  │                         │  │
│   │                                         │   │  │ ┌─────┬─────┬─────┬───┐ │  │
│   │   Lorem ipsum dolor sit amet...         │   │  │ │  3  │  8  │  7  │ 5 │ │  │
│   │                                         │   │  │ │ 🔴  │ 🟠  │ 🟡  │🔵 │ │  │
│   │   ┌──────────────────────┐              │   │  │ └─────┴─────┴─────┴───┘ │  │
│   │   │  Newsletter Signup   │              │   │  │                         │  │
│   │   │  ┌────────────────┐  │              │   │  │ Filter: [All ▾]         │  │
│   │   │  │ Email input    │← No label       │   │  │                         │  │
│   │   │  └────────────────┘  │              │   │  │ ┌─────────────────────┐ │  │
│   │   │  [ Subscribe ]       │              │   │  │ │ 🔴 Critical         │ │  │
│   │   └──────────────────────┘              │   │  │ │                     │ │  │
│   │                                         │   │  │ │ Missing alt text    │ │  │
│   │                                         │   │  │ │ <img src="hero...   │ │  │
│   │                                         │   │  │ │              [→]    │ │  │
│   │                                         │   │  │ ├─────────────────────┤ │  │
│   │                                         │   │  │ │ 🔴 Critical         │ │  │
│   │                                         │   │  │ │                     │ │  │
│   │                                         │   │  │ │ Form input no label │ │  │
│   │                                         │   │  │ │ <input type="em...  │ │  │
│   │                                         │   │  │ │              [→]    │ │  │
│   │                                         │   │  │ └─────────────────────┘ │  │
│   │                                         │   │  │                         │  │
│   └─────────────────────────────────────────┘   │  └─────────────────────────┘  │
│                                                 │                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Issue Detail View (Expanded)

```
┌─────────────────────────────────────┐
│ ← Back to Issues                    │
├─────────────────────────────────────┤
│                                     │
│ 🔴 CRITICAL                         │
│                                     │
│ Image missing alternative text      │
│                                     │
├─────────────────────────────────────┤
│ WCAG 1.1.1 (Level A)                │
│ Non-text Content                    │
│                                     │
│ All non-text content must have a    │
│ text alternative that serves the    │
│ equivalent purpose.                 │
│                                     │
├─────────────────────────────────────┤
│ Element:                            │
│ ┌─────────────────────────────────┐ │
│ │ <img                            │ │
│ │   src="hero-banner.jpg"        │ │
│ │   class="hero-image"           │ │
│ │ >                               │ │
│ └─────────────────────────────────┘ │
│              [Copy] [Highlight]     │
├─────────────────────────────────────┤
│ How to fix:                         │
│                                     │
│ Add an alt attribute that describes │
│ the image content:                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ <img                            │ │
│ │   src="hero-banner.jpg"        │ │
│ │   alt="Team collaborating in   │ │
│ │        modern office space"    │ │
│ │   class="hero-image"           │ │
│ │ >                               │ │
│ └─────────────────────────────────┘ │
│              [Copy Fix]             │
├─────────────────────────────────────┤
│ [Learn More ↗]                      │
│                                     │
│ ◀ Prev    1 of 3    Next ▶         │
└─────────────────────────────────────┘
```

### Highlight Overlay Styles

```css
/* Critical - Red */
.WatchDog-highlight-critical {
  outline: 3px solid #DC2626 !important;
  outline-offset: 2px;
  background-color: rgba(220, 38, 38, 0.1) !important;
}

/* Serious - Orange */
.WatchDog-highlight-serious {
  outline: 3px solid #EA580C !important;
  outline-offset: 2px;
  background-color: rgba(234, 88, 12, 0.1) !important;
}

/* Moderate - Yellow */
.WatchDog-highlight-moderate {
  outline: 3px solid #CA8A04 !important;
  outline-offset: 2px;
  background-color: rgba(202, 138, 4, 0.1) !important;
}

/* Minor - Blue */
.WatchDog-highlight-minor {
  outline: 3px solid #2563EB !important;
  outline-offset: 2px;
  background-color: rgba(37, 99, 235, 0.1) !important;
}

/* Hover state - more prominent */
.WatchDog-highlight-active {
  outline-width: 4px !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
```

### Badge Tooltip on Element

```
                    ┌────────────────────────────┐
                    │ 🔴 Missing alt text        │
     ┌──────────┐   │                            │
     │          │───│ Click to view details      │
     │  IMAGE   │   └────────────────────────────┘
     │          │
     └──────────┘
```

---

## Technical Architecture

### Extension Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTENSION                                │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   POPUP      │    │  SIDE PANEL  │    │   BACKGROUND     │  │
│  │              │    │   (React)    │    │   SERVICE        │  │
│  │ Quick toggle │    │              │    │   WORKER         │  │
│  │ Open panel   │    │ Main UI      │    │                  │  │
│  │              │    │ Issue list   │    │ Badge updates    │  │
│  └──────────────┘    │ Details      │    │ Storage mgmt     │  │
│                      │ Settings     │    │ Message routing  │  │
│                      └──────┬───────┘    └────────┬─────────┘  │
│                             │                     │             │
│                             │  chrome.runtime    │             │
│                             │  .sendMessage      │             │
│                             │                     │             │
│                      ┌──────┴─────────────────────┴──────┐     │
│                      │         CONTENT SCRIPT            │     │
│                      │                                   │     │
│                      │  ┌───────────┐  ┌──────────────┐  │     │
│                      │  │  AXE-CORE │  │   OVERLAY    │  │     │
│                      │  │  Scanner  │  │   Manager    │  │     │
│                      │  └───────────┘  └──────────────┘  │     │
│                      │                                   │     │
│                      └───────────────────────────────────┘     │
│                                      │                         │
└──────────────────────────────────────┼─────────────────────────┘
                                       │
                                       ▼
                      ┌────────────────────────────────┐
                      │         WEB PAGE DOM           │
                      └────────────────────────────────┘
```

### Message Flow

```
User clicks "Scan Page"
        │
        ▼
┌───────────────────┐
│    Side Panel     │
│                   │
│ sendMessage({     │
│   type: 'SCAN'    │
│ })                │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Content Script   │
│                   │
│ 1. Run axe-core   │
│ 2. Filter to 15   │
│    rules          │
│ 3. Map results    │
│ 4. Send back      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    Side Panel     │
│                   │
│ 1. Store results  │
│ 2. Render issues  │
│ 3. Update badge   │
└───────────────────┘


User clicks issue
        │
        ▼
┌───────────────────┐
│    Side Panel     │
│                   │
│ sendMessage({     │
│   type: 'HIGHLIGHT│
│   selector: '...' │
│ })                │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Content Script   │
│                   │
│ 1. Find element   │
│ 2. Add highlight  │
│    class          │
│ 3. Scroll into    │
│    view           │
└───────────────────┘
```

---

## shadcn/ui Setup & Components

### Installation

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
```

### Key Components Mapping

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
| Separators | `Separator` | Visual dividers |

### Component Examples

```tsx
// Scan Button with Loading State
import { Button } from '@/components/ui/button';

<Button
  onClick={handleScan}
  disabled={isScanning}
>
  {isScanning ? 'Scanning...' : 'Scan Page'}
</Button>

// Issue Card
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

<Card className="cursor-pointer hover:bg-accent">
  <CardHeader>
    <div className="flex items-center justify-between">
      <Badge variant={severityVariant}>{severity}</Badge>
      <span className="text-sm text-muted-foreground">WCAG {wcagLevel}</span>
    </div>
  </CardHeader>
  <CardContent>
    <CardTitle className="text-base mb-2">{message}</CardTitle>
    <code className="text-xs text-muted-foreground">{elementSnippet}</code>
  </CardContent>
</Card>

// Filter Tabs
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs value={activeFilter} onValueChange={setActiveFilter}>
  <TabsList>
    <TabsTrigger value="all">All ({total})</TabsTrigger>
    <TabsTrigger value="critical">Critical ({critical})</TabsTrigger>
    <TabsTrigger value="serious">Serious ({serious})</TabsTrigger>
    <TabsTrigger value="moderate">Moderate ({moderate})</TabsTrigger>
  </TabsList>
</Tabs>
```

### Dark Mode Setup

shadcn/ui includes dark mode support via the `next-themes` pattern:

```tsx
// App.tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="watchdog-theme">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### Tailwind Configuration

shadcn/ui extends your Tailwind config with CSS variables for theming:

```js
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more color variables
      },
    },
  },
}
```

---

## Hybrid axe-core Integration

### Why Hybrid?

| Aspect | axe-core | Custom |
|--------|----------|--------|
| Rule accuracy | ✅ Industry standard | ❌ Risk of false positives |
| Time to build | ✅ Ready to use | ❌ Weeks of work |
| Learning value | ❌ Black box | ✅ Deep understanding |
| UI/UX | ❌ Basic | ✅ Full control |
| Customization | ❌ Limited | ✅ Anything possible |

**Hybrid approach:** Use axe-core for scanning, build custom everything else.

### axe-core Integration

```typescript
// content/scanner.ts
import axe from 'axe-core';

// Our 15 rule IDs
const MVP_RULES = [
  'image-alt',
  'button-name', 
  'link-name',
  'color-contrast',
  'label',
  'html-has-lang',
  'document-title',
  'heading-order',
  'region',
  'aria-valid-attr',
  'aria-required-attr',
  'aria-roles',
  'meta-viewport',
  'tabindex',
  'duplicate-id'
];

export async function scanPage(): Promise<ScanResult> {
  const startTime = performance.now();
  
  // Configure axe to only run our 15 rules
  const results = await axe.run(document, {
    runOnly: {
      type: 'rule',
      values: MVP_RULES
    },
    resultTypes: ['violations', 'incomplete']
  });
  
  const duration = performance.now() - startTime;
  
  // Transform axe results to our format
  return {
    url: window.location.href,
    timestamp: Date.now(),
    duration,
    issues: transformViolations(results.violations),
    incomplete: transformViolations(results.incomplete),
    summary: generateSummary(results.violations)
  };
}

function transformViolations(violations: axe.Result[]): Issue[] {
  const issues: Issue[] = [];
  
  for (const violation of violations) {
    for (const node of violation.nodes) {
      issues.push({
        id: generateId(),
        ruleId: violation.id,
        severity: mapSeverity(violation.impact),
        category: mapCategory(violation.tags),
        message: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        wcag: extractWcag(violation.tags),
        element: {
          selector: node.target[0] as string,
          html: node.html,
          failureSummary: node.failureSummary
        },
        fix: generateFix(violation.id, node)
      });
    }
  }
  
  return issues;
}
```

### Custom Fix Suggestions

axe-core gives us the "what's wrong" but we build rich "how to fix" suggestions:

```typescript
// shared/fixes.ts

interface FixSuggestion {
  description: string;
  code: string;
  learnMoreUrl: string;
}

const FIX_TEMPLATES: Record<string, (element: ElementInfo) => FixSuggestion> = {
  
  'image-alt': (el) => ({
    description: 'Add descriptive alt text that conveys the image content',
    code: el.html.replace(
      '<img',
      '<img alt="[Describe what the image shows]"'
    ),
    learnMoreUrl: 'https://webaim.org/techniques/alttext/'
  }),
  
  'button-name': (el) => ({
    description: 'Add text content or aria-label to the button',
    code: el.html.includes('aria-label')
      ? el.html
      : el.html.replace('>', ' aria-label="[Button purpose]">'),
    learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name'
  }),
  
  'color-contrast': (el) => ({
    description: 'Increase contrast ratio to at least 4.5:1 for normal text',
    code: `/* Current contrast is too low */
/* Suggested fixes: */
/* 1. Darken text color */
/* 2. Lighten background */
/* 3. Increase font size to 18px+ (large text needs 3:1) */`,
    learnMoreUrl: 'https://webaim.org/resources/contrastchecker/'
  }),
  
  'label': (el) => ({
    description: 'Associate a label with the input using for/id or wrapping',
    code: `<label for="input-id">Label text</label>
${el.html.replace('<input', '<input id="input-id"')}`,
    learnMoreUrl: 'https://webaim.org/techniques/forms/controls'
  }),
  
  // ... more fix templates
};

export function generateFix(ruleId: string, element: ElementInfo): FixSuggestion {
  const template = FIX_TEMPLATES[ruleId];
  if (template) {
    return template(element);
  }
  return {
    description: 'See documentation for fix guidance',
    code: '',
    learnMoreUrl: `https://dequeuniversity.com/rules/axe/4.4/${ruleId}`
  };
}
```

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

### manifest.json (MV3)

```json
{
  "manifest_version": 3,
  "name": "WatchDog",
  "version": "1.0.0",
  "description": "Instant accessibility audits with visual highlighting",
  
  "permissions": [
    "activeTab",
    "storage",
    "sidePanel"
  ],
  
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  
  "side_panel": {
    "default_path": "sidepanel/index.html"
  },
  
  "background": {
    "service_worker": "background/index.ts",
    "type": "module"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.ts"],
      "css": ["content/styles.css"],
      "run_at": "document_idle"
    }
  ],
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  
  "web_accessible_resources": [
    {
      "resources": ["content/styles.css"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

## Development Phases

### Phase 1: Setup & Foundation (Week 1)

**Day 1-2: Project Setup**
- [ ] Initialize Vite + CRXJS + React + TypeScript
- [ ] Configure Tailwind CSS
- [ ] Initialize shadcn/ui (`npx shadcn-ui@latest init`)
- [ ] Install core shadcn components (Button, Card, Badge, Tabs, ScrollArea)
- [ ] Set up ESLint + Prettier
- [ ] Create folder structure
- [ ] Basic manifest.json

**Day 3-4: Extension Shell**
- [ ] Popup with "Open Side Panel" button (shadcn Button)
- [ ] Side panel basic UI with shadcn components (header, empty state)
- [ ] Background service worker
- [ ] Message passing infrastructure
- [ ] Test dark mode support

**Day 5-7: Content Script Basics**
- [ ] Content script injection
- [ ] Basic axe-core integration
- [ ] Test scan on sample pages
- [ ] Console logging results

**Deliverable:** Extension loads, popup opens panel, can run axe scan.

---

### Phase 2: Core Scanner (Week 2)

**Day 1-2: axe-core Integration**
- [ ] Configure 15-rule filter
- [ ] Transform results to our Issue type
- [ ] Severity mapping
- [ ] Category mapping

**Day 3-4: Side Panel UI**
- [ ] Scan button with loading state (shadcn Button with spinner)
- [ ] Summary cards using shadcn Card component (severity breakdown)
- [ ] Issue list component with shadcn ScrollArea
- [ ] Basic filtering by severity using shadcn Tabs

**Day 5-7: Issue Cards**
- [ ] Issue card design using shadcn Card
- [ ] Show element snippet with code styling
- [ ] WCAG badge using shadcn Badge
- [ ] "View" button using shadcn Button

**Deliverable:** Can scan page and see issues in side panel.

---

### Phase 3: Highlighting System (Week 3)

**Day 1-2: Overlay Manager**
- [ ] Inject highlight styles
- [ ] Add/remove highlight classes
- [ ] Scroll element into view
- [ ] Handle dynamic elements

**Day 3-4: Two-way Highlighting**
- [ ] Click issue → highlight element
- [ ] Hover issue → preview highlight
- [ ] Clear highlights on panel close

**Day 5-7: Element Badges**
- [ ] Small badge on highlighted elements
- [ ] Badge shows severity icon
- [ ] Click badge → open issue in panel

**Deliverable:** Full highlighting system working.

---

### Phase 4: Issue Details & Fixes (Week 4)

**Day 1-2: Issue Detail View**
- [ ] Full issue detail component using shadcn Card
- [ ] WCAG criteria explanation with proper typography
- [ ] Element HTML display using shadcn code block styling
- [ ] Navigation (prev/next issue) with shadcn Buttons

**Day 3-4: Fix Suggestions**
- [ ] Create fix templates for all 15 rules
- [ ] Code block with syntax highlighting
- [ ] Copy fix button using shadcn Button with copy icon
- [ ] "Learn More" links using shadcn Button variant

**Day 5-7: Settings & Polish**
- [ ] Settings panel using shadcn components (Switch, Select, etc.)
- [ ] Badge count updates
- [ ] Persist scan results
- [ ] Error handling with shadcn Toast notifications

**Deliverable:** Full MVP feature complete.

---

### Phase 5: Testing & Launch (Week 5)

**Day 1-2: Testing**
- [ ] Test on 20+ real websites
- [ ] Fix edge cases
- [ ] Performance optimization
- [ ] Memory leak checks

**Day 3-4: Polish**
- [ ] Empty states with shadcn components
- [ ] Loading states and skeletons
- [ ] Smooth animations/transitions
- [ ] Dark mode support (shadcn provides this out of the box)

**Day 5-7: Chrome Web Store**
- [ ] Create store listing
- [ ] Screenshots (1280x800)
- [ ] Promotional images
- [ ] Privacy policy
- [ ] Submit for review

**Deliverable:** Published to Chrome Web Store! 🎉

---

## v1.1 Roadmap (Post-MVP)

### ✅ Vision Simulators (COMPLETED)

**Implementation:** `src/content/vision-filters.ts`

```typescript
// Colorblind simulation using SVG color matrix filters
const SVG_FILTERS = {
  protanopia: `<feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0 ..."/>`,
  deuteranopia: `<feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0 ..."/>`,
  tritanopia: `<feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0 ..."/>`,
  achromatopsia: `<feColorMatrix type="matrix" values="0.299, 0.587, 0.114, 0, 0 ..."/>`,
};

// Blur simulation with vision acuity ratings
const BLUR_LEVELS = {
  'blur-low': 2,     // 20/40 vision
  'blur-medium': 4,  // 20/70 vision
  'blur-high': 8,    // 20/200 vision (legal blindness)
};
```

**Features:**
- Separate dropdowns for colorblind modes and blur levels
- Real-time application via content script messaging
- Scientifically accurate color matrix filters
- Vision acuity descriptions for blur modes

### ✅ Focus Order Visualization (COMPLETED)

**Implementation:** `src/content/focus-order.ts`

```typescript
// Draw numbered badges showing tab order
export function showFocusOrder(): void {
  const focusableElements = getFocusableElements();

  focusableElements.forEach((element, index) => {
    const badge = createBadge(index + 1);
    positionBadge(badge, element);
    highlightElement(element);
  });

  // Update positions on scroll and resize
  window.addEventListener('scroll', updatePositions, true);
  window.addEventListener('resize', updatePositions);
}
```

**Features:**
- Numbered blue badges on all focusable elements
- Respects custom tabindex values
- Dynamic position updates on scroll/resize
- Element highlighting with blue outlines
- Toggle from Settings panel

### ✅ Report Export (COMPLETED)

**Implementation:** `src/sidepanel/lib/export.ts`, `src/sidepanel/components/ExportButton.tsx`

**Formats:**
- **PDF** - Professional document with page screenshot, summary, and all issue details
- **JSON** - Complete scan data for CI/CD pipelines and automation
- **CSV** - Tabular format for Excel/Google Sheets analysis
- **HTML** - Beautiful standalone report with styling, shareable with stakeholders

**Features:**
- Dropdown menu in header with format descriptions
- Loading states during export
- Automatic file downloads with timestamped filenames
- PDF includes captured screenshot of audited page

### 🚧 Future Features

- [ ] Historical scan comparison
- [ ] Real-time monitoring mode

---

## Quick Reference

### Key Files to Build First

1. Initialize shadcn/ui and install core components
2. `src/shared/types.ts` - All TypeScript interfaces
3. `src/sidepanel/lib/utils.ts` - shadcn cn() utility
4. `src/content/scanner.ts` - axe-core wrapper
5. `src/sidepanel/store/index.ts` - Zustand state
6. `src/sidepanel/components/IssueList.tsx` - Main UI using shadcn components
7. `src/content/overlay.ts` - Highlighting

### Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Build
npm run build        # Production build

# Test
npm run test         # Run tests

# Lint
npm run lint         # ESLint check

# shadcn/ui
npx shadcn-ui@latest init              # Initialize shadcn/ui
npx shadcn-ui@latest add [component]   # Add a component
```

### Chrome Extension Loading

1. Build: `npm run build`
2. Open: `chrome://extensions`
3. Enable: "Developer mode"
4. Click: "Load unpacked"
5. Select: `dist` folder

---

## Questions Resolved ✅

| Question | Decision | Status |
|----------|----------|--------|
| MVP rules count | 15 rules | ✅ Implemented |
| UI approach | Side panel + highlighting | ✅ Implemented |
| Component library | shadcn/ui (Radix UI + Tailwind) | ✅ Implemented |
| Vision simulators | v1.1 | ✅ Completed |
| Focus order viz | v1.1 | ✅ Completed |
| Report export | v1.1 | ✅ Completed |
| Rule engine | Hybrid (axe-core + custom UI) | ✅ Implemented |
| Timeline | Flexible | Ongoing |

---

## Project Status 🎉

**MVP:** ✅ COMPLETE
**v1.1 Features:** ✅ COMPLETE (Vision Simulators, Focus Order, Report Export)
**Next:** v1.2 Features (Historical Comparison, Real-time Monitoring)
