/**
 * Export utilities for accessibility reports
 * Supports JSON, CSV, HTML, PDF formats and clipboard copy
 */

import type { Issue, ScanResult, Severity } from '@/shared/types';
import { isWcagIssue, STANDARD_LABELS } from '@/sidepanel/lib/standards';
import type { AuditType } from '@/sidepanel/store';
import { buildReportHtml } from './report-template';

/**
 * Format audit type for display
 */
const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
};

/**
 * Download a file with the given content and filename
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format timestamp for filenames
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Re-exported so existing importers (and tests) keep resolving escapeHtml from
// this module; the implementation, plus URL/color sanitizers, now lives in
// html-escape.ts and is shared with the report template.
export { escapeHtml } from './html-escape';

/**
 * pdf-lib's StandardFonts (Helvetica/Helvetica-Bold) use WinAnsi (CP1252)
 * encoding, which cannot represent characters outside that set — emoji, CJK,
 * smart quotes, em dashes, the narrow no-break space some locales put in
 * timestamps, etc. Passing any such character to drawText OR widthOfTextAtSize
 * makes pdf-lib throw, which previously aborted the entire PDF export (the user
 * only saw a silent console.error). Map the common typographic offenders to
 * their ASCII equivalents and replace anything still unencodable with '?', so a
 * report with page-derived text always renders instead of failing outright.
 */
export function toPdfSafeText(text: string): string {
  return (
    String(text)
      // Curly single quotes / low quotes -> ASCII apostrophe.
      .replace(/[‘’‚‛]/g, "'")
      // Curly double quotes / low quotes -> ASCII quote.
      .replace(/[“”„‟]/g, '"')
      // Hyphen / en / em / figure dashes and minus sign -> ASCII hyphen.
      .replace(/[‐‑‒–—―−]/g, '-')
      // Horizontal ellipsis -> three dots.
      .replace(/…/g, '...')
      // Bullet characters -> ASCII hyphen.
      .replace(/[•‣⁃◦]/g, '-')
      // Zero-width / non-joiner characters and the BOM -> dropped.
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Every remaining whitespace char (tabs, newlines, the no-break / narrow /
      // CJK spaces some locales emit in formatted timestamps) -> a normal space
      // drawText can actually lay out.
      .replace(/\s/g, ' ')
      // Anything left outside printable ASCII + the Latin-1 supplement (all of
      // which WinAnsi can encode) becomes '?' so encoding never throws.
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
  );
}

/**
 * Export scan results as JSON
 */
export function exportJSON(result: ScanResult): void {
  const json = JSON.stringify(result, null, 2);
  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Export scan results as CSV
 */
export function exportCSV(result: ScanResult): void {
  const headers = [
    'Severity',
    'Category',
    'Rule ID',
    'Message',
    'WCAG Criterion',
    'WCAG Level',
    'Element Selector',
    'HTML',
    'Fix Description',
    'Learn More URL',
  ];

  const rows = result.issues.map((issue) => [
    issue.severity,
    issue.category,
    issue.ruleId,
    issue.message,
    `${issue.wcag.id} - ${issue.wcag.name}`,
    issue.wcag.level,
    issue.element.selector,
    issue.element.html,
    issue.fix.description,
    issue.helpUrl,
  ]);

  // Neutralize CSV/formula injection: a cell whose value begins with =, +, -, or
  // @ is treated as a formula by spreadsheet apps. Prefix it with a single quote
  // so it is rendered as literal text instead of being evaluated.
  const neutralizeCsvInjection = (value: string): string =>
    /^[=+\-@]/.test(value) ? `'${value}` : value;

  // Escape CSV values
  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvValue(neutralizeCsvInjection(cell))).join(',')),
  ].join('\n');

  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.csv`;
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export scan results as HTML
 */
export function exportHTML(result: ScanResult, auditType: AuditType = 'accessibility'): void {
  const html = buildReportHtml(result, auditType);
  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.html`;
  downloadFile(html, filename, 'text/html');
}

/**
 * Export scan results as PDF using pdf-lib
 */
export async function exportPDF(
  result: ScanResult,
  auditType: AuditType = 'accessibility'
): Promise<void> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const auditLabel = AUDIT_TYPE_LABELS[auditType];

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595; // A4 width in points
  const pageHeight = 842; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;

  let page = doc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;

  const addNewPage = () => {
    page = doc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition - requiredSpace < margin) {
      addNewPage();
    }
  };

  // Helper to wrap text
  const wrapText = (
    text: string,
    maxWidth: number,
    fontSize: number,
    font: typeof helvetica
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Header background
  page.drawRectangle({
    x: 0,
    y: pageHeight - 80,
    width: pageWidth,
    height: 80,
    color: rgb(37 / 255, 99 / 255, 235 / 255),
  });

  // Header text
  page.drawText(`WatchDog ${auditLabel} Report`, {
    x: margin,
    y: pageHeight - 50,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  yPosition = pageHeight - 110;

  // Metadata
  const metaLines = [
    `URL: ${result.url}`,
    `Date: ${new Date(result.timestamp).toLocaleString()}`,
    `Scan Duration: ${result.duration.toFixed(0)}ms`,
    `Total Issues: ${result.summary.total}`,
  ];

  for (const line of metaLines) {
    page.drawText(toPdfSafeText(line), {
      x: margin,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= 16;
  }

  yPosition -= 10;

  // Summary section
  checkPageBreak(100);
  page.drawText('Summary', {
    x: margin,
    y: yPosition,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= 25;

  const severities: Array<{ key: Severity; label: string; color: [number, number, number] }> = [
    { key: 'critical', label: 'Critical', color: [220, 38, 38] },
    { key: 'serious', label: 'Serious', color: [234, 88, 12] },
    { key: 'moderate', label: 'Moderate', color: [202, 138, 4] },
    { key: 'minor', label: 'Minor', color: [37, 99, 235] },
  ];

  for (const { key, label, color } of severities) {
    const count = result.summary.bySeverity[key];
    page.drawRectangle({
      x: margin,
      y: yPosition - 3,
      width: 12,
      height: 12,
      color: rgb(color[0] / 255, color[1] / 255, color[2] / 255),
    });
    page.drawText(`${label}: ${count}`, {
      x: margin + 18,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= 18;
  }

  yPosition -= 20;

  // Issues by severity
  for (const { key: severity, label } of severities) {
    const issues = result.issues.filter((i) => i.severity === severity);
    if (issues.length === 0) continue;

    checkPageBreak(40);
    page.drawText(`${label} Issues (${issues.length})`, {
      x: margin,
      y: yPosition,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 22;

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      checkPageBreak(80);

      // Issue title
      const titleLines = wrapText(
        toPdfSafeText(`${i + 1}. ${issue.message}`),
        contentWidth,
        11,
        helveticaBold
      );
      for (const line of titleLines) {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        yPosition -= 14;
      }

      // Lead with the plain-language consequence (when the scanner supplied it)
      // so a non-technical reader gets the stakes before the standards detail.
      if (issue.whyItMatters) {
        const whyLines = wrapText(
          toPdfSafeText(`Why this matters: ${issue.whyItMatters}`),
          contentWidth,
          9,
          helvetica
        );
        for (const line of whyLines) {
          checkPageBreak(12);
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: 9,
            font: helvetica,
            color: rgb(0.12, 0.25, 0.6),
          });
          yPosition -= 12;
        }
      }

      // Standard info — audit-aware so a Performance/SEO/etc. finding is never
      // mislabelled "WCAG". Accessibility issues keep their criterion and name.
      const standardLine = isWcagIssue(issue.standard)
        ? `WCAG ${issue.wcag.id} (${issue.wcag.level}) - ${issue.wcag.name}`
        : STANDARD_LABELS[issue.standard!];
      page.drawText(toPdfSafeText(standardLine), {
        x: margin,
        y: yPosition,
        size: 9,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 14;

      // Selector (truncate if too long)
      const selector =
        issue.element.selector.length > 80
          ? `${issue.element.selector.slice(0, 77)}...`
          : issue.element.selector;
      page.drawText(toPdfSafeText(`Location (CSS selector): ${selector}`), {
        x: margin,
        y: yPosition,
        size: 9,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 14;

      // Fix description
      const fixLines = wrapText(
        toPdfSafeText(`How to fix it: ${issue.fix.description}`),
        contentWidth,
        9,
        helvetica
      );
      for (const line of fixLines) {
        checkPageBreak(14);
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 9,
          font: helvetica,
          color: rgb(0, 0, 0),
        });
        yPosition -= 12;
      }

      yPosition -= 10;
    }

    yPosition -= 10;
  }

  // Footer on last page
  page.drawText(toPdfSafeText(`Generated by WatchDog v1.0.0 on ${new Date().toLocaleString()}`), {
    x: pageWidth / 2 - 100,
    y: 30,
    size: 8,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });

  // Save PDF
  const pdfBytes = await doc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.pdf`;
  downloadFile(blob, filename, 'application/pdf');
}

/**
 * Format issues as Markdown for clipboard copy
 */
export function issuesToMarkdown(
  issues: Issue[],
  result: ScanResult,
  auditType: AuditType = 'accessibility'
): string {
  const auditLabel = AUDIT_TYPE_LABELS[auditType];

  const header = `# ${auditLabel} Audit Report

**URL:** ${result.url}
**Date:** ${new Date(result.timestamp).toLocaleString()}
**Total Issues:** ${issues.length}
**Scan Duration:** ${result.duration.toFixed(0)}ms

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${result.summary.bySeverity.critical} |
| Serious | ${result.summary.bySeverity.serious} |
| Moderate | ${result.summary.bySeverity.moderate} |
| Minor | ${result.summary.bySeverity.minor} |

---

## Issues

`;

  const issueList = issues
    .map(
      (issue, i) => `### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}

**WCAG:** ${issue.wcag.id} - ${issue.wcag.name} (Level ${issue.wcag.level})
**Category:** ${issue.category}

#### Description
${issue.description}

#### Element
\`\`\`html
${issue.element.html}
\`\`\`

**Selector:** \`${issue.element.selector}\`

#### How to Fix
${issue.fix.description}

${issue.fix.code ? `\`\`\`html\n${issue.fix.code}\n\`\`\`` : ''}

**Learn More:** [${issue.wcag.name}](${issue.helpUrl})

---
`
    )
    .join('\n');

  const footer = `
*Generated by WatchDog on ${new Date().toLocaleString()}*
`;

  return header + issueList + footer;
}

/**
 * Format issues as plain text for clipboard copy
 */
export function issuesToPlainText(
  issues: Issue[],
  result: ScanResult,
  auditType: AuditType = 'accessibility'
): string {
  const auditLabel = AUDIT_TYPE_LABELS[auditType];

  const header = `${auditLabel.toUpperCase()} AUDIT REPORT
${'='.repeat(50)}

URL: ${result.url}
Date: ${new Date(result.timestamp).toLocaleString()}
Total Issues: ${issues.length}
Scan Duration: ${result.duration.toFixed(0)}ms

SUMMARY
${'-'.repeat(30)}
Critical: ${result.summary.bySeverity.critical}
Serious: ${result.summary.bySeverity.serious}
Moderate: ${result.summary.bySeverity.moderate}
Minor: ${result.summary.bySeverity.minor}

${'='.repeat(50)}
ISSUES
${'='.repeat(50)}

`;

  const issueList = issues
    .map(
      (issue, i) => `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}
${'-'.repeat(40)}
WCAG: ${issue.wcag.id} - ${issue.wcag.name} (Level ${issue.wcag.level})
Category: ${issue.category}

Description:
${issue.description}

Element:
${issue.element.html}

Selector: ${issue.element.selector}

How to Fix:
${issue.fix.description}

${issue.fix.code ? `Code:\n${issue.fix.code}\n` : ''}
Learn More: ${issue.helpUrl}

`
    )
    .join('\n');

  const footer = `${'='.repeat(50)}
Generated by WatchDog on ${new Date().toLocaleString()}
`;

  return header + issueList + footer;
}

/**
 * Copy text to clipboard and return success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format issues for GitHub Issues (simplified markdown)
 */
export function issuesToGitHubMarkdown(
  issues: Issue[],
  result: ScanResult,
  auditType: AuditType = 'accessibility'
): string {
  const auditLabel = AUDIT_TYPE_LABELS[auditType];

  const header = `## ${auditLabel} Issues Found

**URL:** ${result.url}
**Total Issues:** ${issues.length}

`;

  const issueList = issues
    .map(
      (issue) => `- [ ] **[${issue.severity.toUpperCase()}]** ${issue.message}
  - WCAG ${issue.wcag.id} (${issue.wcag.level})
  - Selector: \`${issue.element.selector}\`
  - Fix: ${issue.fix.description}`
    )
    .join('\n');

  return header + issueList;
}
