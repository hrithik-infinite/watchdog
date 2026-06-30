// UX-gallery bootstrap: stub `chrome` and seed the store with mock data.
//
// Imported FIRST from gallery/main.tsx (before <Gallery>), mirroring how the
// real side panel loads src/sidepanel/mock-chrome.ts before <App>. This lets the
// real components render in a normal browser with no extension runtime.

import { DEFAULT_SETTINGS } from '@/shared/constants';
import type { Issue, ScanResult } from '@/shared/types';
import { useScanStore } from '@/sidepanel/store';

// A fuller chrome stub than the side panel's standalone one: also covers the
// permission/scripting/action surfaces that overlay + scan handlers touch, so
// clicking around the gallery never throws.
function installChromeStub() {
  const ok = () => Promise.resolve({ success: true });
  // biome-ignore lint/suspicious/noExplicitAny: partial chrome stub for standalone preview
  (globalThis as any).chrome = {
    runtime: {
      id: 'gallery-mock',
      sendMessage: ok,
      onMessage: { addListener: () => {}, removeListener: () => {} },
      lastError: undefined,
    },
    tabs: {
      query: () => Promise.resolve([{ id: 1, url: 'https://example.com', active: true }]),
      sendMessage: ok,
    },
    storage: {
      local: { get: () => Promise.resolve({}), set: () => Promise.resolve() },
      onChanged: { addListener: () => {}, removeListener: () => {} },
    },
    permissions: {
      contains: () => Promise.resolve(true),
      request: () => Promise.resolve(true),
    },
    scripting: { executeScript: () => Promise.resolve([]) },
    action: {
      setBadgeText: ok,
      setBadgeBackgroundColor: ok,
    },
  };
}

// ── Mock dataset ────────────────────────────────────────────────────────────
// Six issues spanning every severity and several categories, each with the
// plain-language `whyItMatters` line so the cards render their full content.
export const MOCK_ISSUES: Issue[] = [
  {
    id: 'issue-1',
    ruleId: 'image-alt',
    severity: 'critical',
    category: 'images',
    message: 'Image has no alt text',
    description: 'Ensures <img> elements have alternate text or a role of none or presentation.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
    whyItMatters: 'Screen readers skip this image, so blind visitors miss what it shows.',
    wcag: { id: '1.1.1', level: 'A', name: 'Non-text Content', description: 'WCAG 1.1.1' },
    element: {
      selector: 'img.hero-image',
      html: '<img src="hero.jpg" class="hero-image">',
      failureSummary: 'Element does not have an alt attribute',
    },
    fix: {
      description: 'Add descriptive alt text that conveys the image content.',
      code: '<img src="hero.jpg" class="hero-image" alt="Team celebrating a product launch">',
      learnMoreUrl: 'https://webaim.org/techniques/alttext/',
    },
  },
  {
    id: 'issue-2',
    ruleId: 'color-contrast',
    severity: 'serious',
    category: 'color',
    message: 'Text contrast is too low',
    description: 'Ensures the contrast between foreground and background meets WCAG 2 AA.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
    whyItMatters: 'Low-vision visitors and anyone in bright light can’t read this text.',
    wcag: { id: '1.4.3', level: 'AA', name: 'Contrast (Minimum)', description: 'WCAG 1.4.3' },
    element: {
      selector: 'p.muted',
      html: '<p class="muted">Read our latest updates</p>',
      failureSummary: 'Element has insufficient color contrast of 3.1:1 (expected 4.5:1)',
    },
    fix: {
      description: 'Darken the text or lighten the background to reach 4.5:1.',
      code: '.muted { color: #595959; } /* was #9b9b9b */',
      learnMoreUrl: 'https://webaim.org/resources/contrastchecker/',
    },
  },
  {
    id: 'issue-3',
    ruleId: 'button-name',
    severity: 'serious',
    category: 'interactive',
    message: 'Button has no accessible name',
    description: 'Ensures buttons have discernible text.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
    whyItMatters: 'Keyboard and screen-reader users don’t know what this button does.',
    wcag: { id: '4.1.2', level: 'A', name: 'Name, Role, Value', description: 'WCAG 4.1.2' },
    element: {
      selector: 'button.icon-btn',
      html: '<button class="icon-btn"><svg aria-hidden="true">…</svg></button>',
      failureSummary: 'Element does not have inner text that is visible to screen readers',
    },
    fix: {
      description: 'Add visible text or an aria-label to the button.',
      code: '<button class="icon-btn" aria-label="Close menu"><svg aria-hidden="true">…</svg></button>',
      learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
    },
  },
  {
    id: 'issue-4',
    ruleId: 'label',
    severity: 'moderate',
    category: 'forms',
    message: 'Form field has no label',
    description: 'Ensures every form element has a programmatically associated label.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
    whyItMatters: 'People using screen readers can’t tell what to type in this field.',
    wcag: { id: '1.3.1', level: 'A', name: 'Info and Relationships', description: 'WCAG 1.3.1' },
    element: {
      selector: 'input#email',
      html: '<input type="email" id="email" placeholder="Enter email">',
      failureSummary: 'Form element does not have an associated label',
    },
    fix: {
      description: 'Associate a <label> with the input via for/id.',
      code: '<label for="email">Email address</label>\n<input type="email" id="email">',
      learnMoreUrl: 'https://webaim.org/techniques/forms/controls',
    },
  },
  {
    id: 'issue-5',
    ruleId: 'heading-order',
    severity: 'minor',
    category: 'structure',
    message: 'Heading levels skip a level',
    description: 'Ensures the order of headings is semantically correct.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
    whyItMatters: 'Skipped heading levels make the page outline confusing to navigate.',
    wcag: { id: '1.3.1', level: 'A', name: 'Info and Relationships', description: 'WCAG 1.3.1' },
    element: {
      selector: 'h4.section-title',
      html: '<h4 class="section-title">Features</h4>',
      failureSummary: 'Heading order invalid — h2 expected, found h4',
    },
    fix: {
      description: 'Use the next heading level instead of skipping.',
      code: '<h2 class="section-title">Features</h2>',
      learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
    },
  },
  {
    id: 'issue-6',
    ruleId: 'link-name',
    severity: 'moderate',
    category: 'interactive',
    message: 'Link has no discernible text',
    description: 'Ensures links have discernible text.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/link-name',
    whyItMatters: 'Screen-reader users hear “link” with no idea where it goes.',
    wcag: { id: '2.4.4', level: 'A', name: 'Link Purpose', description: 'WCAG 2.4.4' },
    element: {
      selector: 'a.card-link',
      html: '<a class="card-link" href="/pricing"><svg aria-hidden="true">…</svg></a>',
      failureSummary: 'Element does not have text that is visible to screen readers',
    },
    fix: {
      description: 'Add link text or an aria-label.',
      code: '<a class="card-link" href="/pricing" aria-label="See pricing">…</a>',
      learnMoreUrl: 'https://dequeuniversity.com/rules/axe/4.4/link-name',
    },
  },
];

const MOCK_INCOMPLETE: Issue[] = [
  {
    id: 'incomplete-1',
    ruleId: 'color-contrast',
    severity: 'moderate',
    category: 'color',
    message: 'Contrast could not be determined automatically',
    description: 'An image or gradient background needs a manual contrast check.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
    wcag: { id: '1.4.3', level: 'AA', name: 'Contrast (Minimum)', description: 'WCAG 1.4.3' },
    element: {
      selector: '.hero h1',
      html: '<h1>Welcome</h1>',
      failureSummary: 'Unable to determine the background color behind this text',
    },
    fix: {
      description: 'Manually verify the text contrast against the background image.',
      code: '',
      learnMoreUrl: 'https://webaim.org/resources/contrastchecker/',
    },
  },
];

function buildResult(issues: Issue[]): ScanResult {
  const count = (s: Issue['severity']) => issues.filter((i) => i.severity === s).length;
  const cat = (c: Issue['category']) => issues.filter((i) => i.category === c).length;
  return {
    url: 'https://example.com',
    timestamp: 0,
    duration: 312,
    issues,
    incomplete: MOCK_INCOMPLETE,
    summary: {
      total: issues.length,
      bySeverity: {
        critical: count('critical'),
        serious: count('serious'),
        moderate: count('moderate'),
        minor: count('minor'),
      },
      byCategory: {
        images: cat('images'),
        interactive: cat('interactive'),
        forms: cat('forms'),
        color: cat('color'),
        document: cat('document'),
        structure: cat('structure'),
        aria: cat('aria'),
        technical: cat('technical'),
      },
    },
  };
}

export const MOCK_SCAN_RESULT = buildResult(MOCK_ISSUES);
export const MOCK_CLEAN_RESULT = buildResult([]);

// ── Bootstrap ───────────────────────────────────────────────────────────────
installChromeStub();

useScanStore.setState({
  scanResult: MOCK_SCAN_RESULT,
  settings: { ...DEFAULT_SETTINGS, hasSeenOnboarding: true, persona: 'site-owner' },
  ignoredHashes: new Set(),
  selectedAuditType: 'accessibility',
  selectedAuditTypes: ['accessibility'],
});
