import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Issue, ScanResult, Severity } from '@/shared/types';
import { escapeHtml, exportCSV, exportHTML, exportPDF, toPdfSafeText } from '../export';
import { safeCssColor } from '../html-escape';

/**
 * exportHTML / exportCSV stream their output through downloadFile, which builds a
 * Blob and hands it to URL.createObjectURL. We stub that to capture the Blob and
 * read its text back, so we can assert on the exact bytes the user would download.
 */
let capturedBlobs: Blob[] = [];
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  capturedBlobs = [];
  URL.createObjectURL = vi.fn((blob: Blob) => {
    capturedBlobs.push(blob);
    return 'blob:mock';
  }) as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  // Anchor clicks would otherwise attempt navigation in happy-dom.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  vi.restoreAllMocks();
});

async function lastDownloadedText(): Promise<string> {
  const blob = capturedBlobs.at(-1);
  if (!blob) throw new Error('no blob captured');
  return blob.text();
}

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    ruleId: 'image-alt',
    severity: 'critical',
    category: 'images',
    message: 'Images must have alternate text',
    description: 'An image is missing an alt attribute.',
    helpUrl: 'https://example.com/help',
    wcag: { id: '1.1.1', level: 'A', name: 'Non-text Content', description: '' },
    element: { selector: 'img', html: '<img src="x">' },
    fix: {
      description: 'Add an alt attribute to the image.',
      code: '<img src="x" alt="...">',
      learnMoreUrl: 'https://example.com/learn',
    },
    ...overrides,
  };
}

function makeResult(issues: Issue[], urlOverride?: string): ScanResult {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  for (const issue of issues) bySeverity[issue.severity] += 1;

  return {
    url: urlOverride ?? 'https://example.com',
    timestamp: 1_700_000_000_000,
    duration: 123,
    issues,
    incomplete: [],
    summary: {
      total: issues.length,
      bySeverity,
      byCategory: {
        images: issues.length,
        interactive: 0,
        forms: 0,
        color: 0,
        document: 0,
        structure: 0,
        aria: 0,
        technical: 0,
      },
    },
  };
}

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<div class="x" data-y='z'>&</div>`)).toBe(
      '&lt;div class=&quot;x&quot; data-y=&#39;z&#39;&gt;&amp;&lt;/div&gt;'
    );
  });
});

describe('exportHTML escaping of page-derived fields', () => {
  it('escapes message, description, fix.description, selector, element html and code', async () => {
    const issue = makeIssue({
      message: `<img src=x onerror=alert('xss-message')>`,
      description: `<script>alert('xss-desc')</script>`,
      element: {
        selector: `<b>sel</b>" onmouseover="alert(1)`,
        html: `<a href="javascript:alert('xss-html')">x</a>`,
      },
      fix: {
        description: `<svg onload=alert('xss-fix')>`,
        code: `<script>steal()</script>`,
        learnMoreUrl: 'https://example.com/learn',
      },
    });
    exportHTML(makeResult([issue]));
    const html = await lastDownloadedText();

    // None of the raw payloads survive as live markup.
    expect(html).not.toContain(`<img src=x onerror=`);
    expect(html).not.toContain(`<script>alert('xss-desc')</script>`);
    expect(html).not.toContain(`<svg onload=`);
    expect(html).not.toContain(`<script>steal()</script>`);
    expect(html).not.toContain(`" onmouseover="alert(1)`);

    // ...they appear escaped instead.
    expect(html).toContain(`&lt;img src=x onerror=alert(&#39;xss-message&#39;)&gt;`);
    expect(html).toContain(`&lt;script&gt;alert(&#39;xss-desc&#39;)&lt;/script&gt;`);
    expect(html).toContain(`&lt;svg onload=alert(&#39;xss-fix&#39;)&gt;`);
    expect(html).toContain(`&lt;b&gt;sel&lt;/b&gt;&quot; onmouseover=&quot;alert(1)`);
    expect(html).toContain(`&lt;script&gt;steal()&lt;/script&gt;`);
  });

  it('escapes the page URL in the meta section', async () => {
    const url = `https://example.com/?q=<script>alert(1)</script>`;
    exportHTML(makeResult([makeIssue()], url));
    const html = await lastDownloadedText();

    expect(html).not.toContain(`<script>alert(1)</script>`);
    expect(html).toContain(`https://example.com/?q=&lt;script&gt;alert(1)&lt;/script&gt;`);
  });

  it('collapses a javascript: URL to a safe href', async () => {
    exportHTML(makeResult([makeIssue()], `javascript:alert('xss-href')`));
    const html = await lastDownloadedText();

    expect(html).not.toContain(`href="javascript:`);
    expect(html).toContain(`href="#"`);
  });

  it('threads the audit type into the report title and kind chip', async () => {
    exportHTML(makeResult([makeIssue()]), 'seo');
    const html = await lastDownloadedText();

    expect(html).toContain('<title>WatchDog SEO Report</title>');
    // The audit label surfaces in the header "kind" chip.
    expect(html).toContain('SEO audit');
    expect(html).not.toContain('WatchDog Accessibility Report');
    expect(html).not.toContain('Accessibility audit');
  });

  it('defaults the title to Accessibility when no audit type is given', async () => {
    exportHTML(makeResult([makeIssue()]));
    const html = await lastDownloadedText();

    expect(html).toContain('<title>WatchDog Accessibility Report</title>');
  });
});

describe('exportCSV formula injection neutralization', () => {
  it('prefixes a single quote to cells starting with = + - or @', async () => {
    const issue = makeIssue({
      message: '=HYPERLINK_CMD',
      ruleId: '@cmd',
      element: { selector: '+1', html: '-danger' },
      fix: {
        description: '-2+3',
        code: '',
        learnMoreUrl: 'https://example.com/learn',
      },
    });
    exportCSV(makeResult([issue]));
    const csv = await lastDownloadedText();

    expect(csv).toContain(`'=HYPERLINK_CMD`);
    expect(csv).toContain(`'@cmd`);
    expect(csv).toContain(`'+1`);
    expect(csv).toContain(`'-danger`);
    expect(csv).toContain(`'-2+3`);

    // No cell may begin (line start or after a comma) with a formula trigger.
    expect(csv).not.toMatch(/(?:^|,)[=+\-@]/m);
  });

  it('leaves benign cells untouched', async () => {
    exportCSV(makeResult([makeIssue({ message: 'Images must have alternate text' })]));
    const csv = await lastDownloadedText();

    expect(csv).toContain('Images must have alternate text');
    expect(csv).not.toContain(`'Images`);
  });
});

describe('exportHTML report content (report-content)', () => {
  it('leads each issue with whyItMatters above the technical description', async () => {
    const why = 'Visitors using a screen reader cannot tell what this image shows.';
    exportHTML(makeResult([makeIssue({ whyItMatters: why })]));
    const html = await lastDownloadedText();

    expect(html).toContain('Why this matters');
    expect(html).toContain(why);

    // The plain-language line must appear *before* the technical description.
    const whyIdx = html.indexOf(why);
    const descIdx = html.indexOf('An image is missing an alt attribute.');
    expect(whyIdx).toBeGreaterThan(-1);
    expect(descIdx).toBeGreaterThan(-1);
    expect(whyIdx).toBeLessThan(descIdx);
  });

  it('omits the why-this-matters block when the issue has no whyItMatters', async () => {
    exportHTML(makeResult([makeIssue()])); // makeIssue() supplies no whyItMatters
    const html = await lastDownloadedText();

    expect(html).not.toContain('Why this matters');
  });

  it('escapes whyItMatters so it cannot inject markup', async () => {
    exportHTML(makeResult([makeIssue({ whyItMatters: `<img src=x onerror=alert('why')>` })]));
    const html = await lastDownloadedText();

    expect(html).not.toContain(`<img src=x onerror=alert('why')>`);
    expect(html).toContain(`&lt;img src=x onerror=alert(&#39;why&#39;)&gt;`);
  });

  it('labels a non-accessibility issue with its standard, not a placeholder WCAG id', async () => {
    // Regression: every non-a11y scanner reuses the wcag field with placeholder
    // values, so the report used to mislabel e.g. a Performance finding "WCAG".
    const issue = makeIssue({
      standard: 'performance',
      message: 'Largest Contentful Paint is slow',
    });
    exportHTML(makeResult([issue]), 'performance');
    const html = await lastDownloadedText();

    expect(html).toContain('Performance metric');
    expect(html).not.toContain('WCAG 1.1.1');
  });

  it('still shows the WCAG criterion for genuine accessibility issues', async () => {
    exportHTML(makeResult([makeIssue()])); // no `standard` -> treated as WCAG
    const html = await lastDownloadedText();

    expect(html).toContain('WCAG 1.1.1 (A)');
  });
});

describe('exportHTML rich report (report-template)', () => {
  it('renders the overall score gauge with a grade', async () => {
    exportHTML(makeResult([makeIssue()]));
    const html = await lastDownloadedText();

    expect(html).toContain('/ 100');
    expect(html).toMatch(/Score \d+ out of 100, grade [A-F]/);
  });

  it('renders a category breakdown from the summary', async () => {
    exportHTML(makeResult([makeIssue()])); // makeResult puts the issue under `images`
    const html = await lastDownloadedText();

    expect(html).toContain('By category');
    expect(html).toContain('Images');
  });

  it('links to the fix learn-more URL', async () => {
    exportHTML(makeResult([makeIssue()]));
    const html = await lastDownloadedText();

    expect(html).toContain('Learn more');
    expect(html).toContain('https://example.com/learn');
  });

  it('renders a needs-review section for incomplete items', async () => {
    const base = makeResult([]);
    const withIncomplete = {
      ...base,
      incomplete: [makeIssue({ message: 'Manual check needed' })],
    };
    exportHTML(withIncomplete);
    const html = await lastDownloadedText();

    expect(html).toContain('Needs review');
    expect(html).toContain('Manual check needed');
  });

  it('shows a clear state when there are no issues', async () => {
    exportHTML(makeResult([]));
    const html = await lastDownloadedText();

    expect(html).toContain('No issues found');
  });

  it('renders a contrast swatch with the measured ratio', async () => {
    const issue = makeIssue({
      category: 'color',
      contrast: { fg: '#777777', bg: '#ffffff', ratio: 3.2, required: 4.5 },
    });
    exportHTML(makeResult([issue]));
    const html = await lastDownloadedText();

    expect(html).toContain('3.20:1');
    expect(html).toContain('needs 4.5:1');
  });

  it('labels a combined multi-standard scan as a website audit', async () => {
    const a11y = makeIssue({ id: 'a', standard: 'wcag' });
    const seo = makeIssue({ id: 'b', standard: 'seo', message: 'Missing meta description' });
    exportHTML(makeResult([a11y, seo]));
    const html = await lastDownloadedText();

    expect(html).toContain('Website audit');
  });

  it('renders element-count and impact chips, failure summary, and a passing contrast', async () => {
    const issue = makeIssue({
      ruleNodeCount: 4,
      impact: 'serious', // differs from severity 'critical' → shown
      element: {
        selector: 'a',
        html: '<a>x</a>',
        failureSummary: 'Fix any of the following:\n  Element is not keyboard focusable',
      },
      contrast: { fg: '#000000', bg: '#ffffff', ratio: 21, required: 4.5 },
    });
    exportHTML(makeResult([issue]));
    const html = await lastDownloadedText();

    expect(html).toContain('4 elements');
    expect(html).toContain('Impact: serious');
    expect(html).toContain('What axe found');
    expect(html).toContain('Element is not keyboard focusable');
    expect(html).toContain('21.00:1');
    expect(html).toContain('passes');
  });

  it('falls back to the rule help URL when the fix has no learn-more link', async () => {
    const issue = makeIssue({
      helpUrl: 'https://help.example/rule-x',
      fix: { description: 'Fix it.', code: '', learnMoreUrl: '' },
    });
    exportHTML(makeResult([issue]));
    const html = await lastDownloadedText();

    expect(html).toContain('https://help.example/rule-x');
  });

  it('formats sub-second and multi-second scan durations', async () => {
    exportHTML({ ...makeResult([makeIssue()]), duration: 250 });
    expect(await lastDownloadedText()).toContain('250ms');

    exportHTML({ ...makeResult([makeIssue()]), duration: 2500 });
    expect(await lastDownloadedText()).toContain('2.5s');
  });

  it('reads as passing for a clean page and failing for a badly broken one', async () => {
    exportHTML(makeResult([makeIssue({ severity: 'minor' })]));
    expect(await lastDownloadedText()).toMatch(/great shape|Solid overall/);

    const many = Array.from({ length: 12 }, (_, i) =>
      makeIssue({ id: `c${i}`, severity: 'critical' })
    );
    exportHTML(makeResult(many));
    expect(await lastDownloadedText()).toContain('Failing');
  });
});

describe('safeCssColor', () => {
  it('passes through valid color notations', () => {
    expect(safeCssColor('#fff')).toBe('#fff');
    expect(safeCssColor('#1a2b3c')).toBe('#1a2b3c');
    expect(safeCssColor('rgb(0, 0, 0)')).toBe('rgb(0, 0, 0)');
    expect(safeCssColor('hsl(120, 50%, 50%)')).toBe('hsl(120, 50%, 50%)');
    expect(safeCssColor('rebeccapurple')).toBe('rebeccapurple');
  });

  it('collapses style-breaking payloads to transparent', () => {
    expect(safeCssColor('red; } body { display: none }')).toBe('transparent');
    expect(safeCssColor('url(https://evil.test/x)')).toBe('transparent');
    expect(safeCssColor('expression(alert(1))')).toBe('transparent');
  });
});

describe('toPdfSafeText (err-10)', () => {
  it('maps common typographic characters to ASCII equivalents', () => {
    expect(toPdfSafeText('“quote” ‘q’ — dash … end')).toBe('"quote" \'q\' - dash ... end');
  });

  it('replaces characters WinAnsi cannot encode with a placeholder', () => {
    // Emoji and CJK are outside WinAnsi; pdf-lib would otherwise throw on them.
    const out = toPdfSafeText('Launch 🚀 文字');
    expect(out.startsWith('Launch ')).toBe(true);
    expect(out).toContain('?');
    expect(out).not.toMatch(/[🚀文字]/u);
    // Only printable ASCII / Latin-1 (all WinAnsi-encodable) survives.
    for (const ch of out) {
      const cp = ch.codePointAt(0) ?? 0;
      expect((cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff)).toBe(true);
    }
  });

  it('keeps Latin-1 accented characters that WinAnsi can encode', () => {
    expect(toPdfSafeText('Café résumé')).toBe('Café résumé');
  });
});

describe('exportPDF resilience to non-WinAnsi text (err-10)', () => {
  it('does not throw and produces a PDF when page text has emoji / smart quotes', async () => {
    // Regression: such characters made pdf-lib's WinAnsi font throw, aborting the
    // whole export. After sanitization the export must complete.
    const issue = makeIssue({
      message: 'Button "Café" 🚀 needs a label — really',
      whyItMatters: 'Visitors can’t tell what this does 🤷 你好',
      fix: {
        description: 'Use the “label” attribute…',
        code: '',
        learnMoreUrl: 'https://example.com/learn',
      },
    });

    await expect(
      exportPDF(makeResult([issue], 'https://例え.example/路径'))
    ).resolves.toBeUndefined();

    const blob = capturedBlobs.at(-1);
    expect(blob?.type).toBe('application/pdf');
    expect(blob && blob.size > 0).toBe(true);
  });
});
