/**
 * Export utilities for accessibility reports
 * Supports JSON, CSV, HTML, PDF formats and clipboard copy
 */

import type { ScanResult, Issue, Severity } from '@/shared/types';
import type { AuditType } from '@/sidepanel/store';

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
  mobile: 'Mobile',
  links: 'Links',
  i18n: 'i18n',
  privacy: 'Privacy',
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

  // Escape CSV values
  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.csv`;
  downloadFile(csvContent, filename, 'text/csv');
}

/**
 * Export scan results as HTML
 */
export function exportHTML(result: ScanResult): void {
  const severityCounts = result.summary.bySeverity;
  const totalIssues = result.summary.total;

  // Group issues by severity
  const issuesBySeverity: Record<Severity, Issue[]> = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  };

  result.issues.forEach((issue) => {
    issuesBySeverity[issue.severity].push(issue);
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WatchDog Accessibility Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f9fafb;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .header p {
      font-size: 1rem;
      opacity: 0.9;
    }

    .meta {
      padding: 1.5rem 2rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .meta-value {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a1a;
      word-break: break-all;
    }

    .summary {
      padding: 2rem;
    }

    .summary h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
    }

    .summary-card-critical {
      background: rgba(220, 38, 38, 0.1);
      border: 2px solid #DC2626;
    }

    .summary-card-serious {
      background: rgba(234, 88, 12, 0.1);
      border: 2px solid #EA580C;
    }

    .summary-card-moderate {
      background: rgba(202, 138, 4, 0.1);
      border: 2px solid #CA8A04;
    }

    .summary-card-minor {
      background: rgba(37, 99, 235, 0.1);
      border: 2px solid #2563EB;
    }

    .summary-count {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .summary-label {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .issues {
      padding: 0 2rem 2rem;
    }

    .severity-section {
      margin-bottom: 2rem;
    }

    .severity-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .severity-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }

    .badge-critical { background: #DC2626; }
    .badge-serious { background: #EA580C; }
    .badge-moderate { background: #CA8A04; }
    .badge-minor { background: #2563EB; }

    .issue-card {
      margin-bottom: 1.5rem;
      padding: 1.5rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .issue-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .issue-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a1a;
      flex: 1;
    }

    .issue-wcag {
      font-size: 0.875rem;
      color: #6b7280;
      background: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      white-space: nowrap;
      margin-left: 1rem;
    }

    .issue-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .issue-element {
      margin-bottom: 1rem;
    }

    .issue-element-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .code-block {
      background: #1a1a1a;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      overflow-x: auto;
      margin-bottom: 1rem;
    }

    .issue-fix {
      background: white;
      padding: 1rem;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    .issue-fix-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .issue-fix-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .footer {
      padding: 2rem;
      text-align: center;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #6b7280;
    }

    @media print {
      body {
        padding: 0;
      }

      .container {
        box-shadow: none;
      }

      .issue-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐕 WatchDog Accessibility Report</h1>
      <p>Automated accessibility audit powered by axe-core</p>
    </div>

    <div class="meta">
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">URL</span>
          <span class="meta-value">${result.url}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Date</span>
          <span class="meta-value">${new Date(result.timestamp).toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Scan Duration</span>
          <span class="meta-value">${result.duration.toFixed(0)}ms</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Total Issues</span>
          <span class="meta-value">${totalIssues}</span>
        </div>
      </div>
    </div>

    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="summary-card summary-card-critical">
          <div class="summary-count" style="color: #DC2626">${severityCounts.critical}</div>
          <div class="summary-label" style="color: #DC2626">Critical</div>
        </div>
        <div class="summary-card summary-card-serious">
          <div class="summary-count" style="color: #EA580C">${severityCounts.serious}</div>
          <div class="summary-label" style="color: #EA580C">Serious</div>
        </div>
        <div class="summary-card summary-card-moderate">
          <div class="summary-count" style="color: #CA8A04">${severityCounts.moderate}</div>
          <div class="summary-label" style="color: #CA8A04">Moderate</div>
        </div>
        <div class="summary-card summary-card-minor">
          <div class="summary-count" style="color: #2563EB">${severityCounts.minor}</div>
          <div class="summary-label" style="color: #2563EB">Minor</div>
        </div>
      </div>
    </div>

    <div class="issues">
      ${(['critical', 'serious', 'moderate', 'minor'] as Severity[])
        .map((severity) => {
          const issues = issuesBySeverity[severity];
          if (issues.length === 0) return '';

          return `
            <div class="severity-section">
              <div class="severity-header">
                <span class="severity-badge badge-${severity}">${severity.toUpperCase()}</span>
                <span>${issues.length} ${issues.length === 1 ? 'Issue' : 'Issues'}</span>
              </div>
              ${issues
                .map(
                  (issue) => `
                <div class="issue-card">
                  <div class="issue-header">
                    <div class="issue-title">${issue.message}</div>
                    <div class="issue-wcag">WCAG ${issue.wcag.id} (${issue.wcag.level})</div>
                  </div>
                  <div class="issue-description">${issue.description}</div>
                  <div class="issue-element">
                    <div class="issue-element-label">Element</div>
                    <div class="code-block">${issue.element.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                  </div>
                  <div class="issue-element">
                    <div class="issue-element-label">Selector</div>
                    <div class="code-block">${issue.element.selector}</div>
                  </div>
                  <div class="issue-fix">
                    <div class="issue-fix-label">How to Fix</div>
                    <div class="issue-fix-description">${issue.fix.description}</div>
                    ${
                      issue.fix.code
                        ? `<div class="code-block">${issue.fix.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
                        : ''
                    }
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="footer">
      <p>Generated by WatchDog v1.0.0 on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 0.5rem;">
        <a href="${result.url}" style="color: #2563eb;">View Original Page</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.html`;
  downloadFile(html, filename, 'text/html');
}

/**
 * Export scan results as PDF using pdf-lib
 */
export async function exportPDF(result: ScanResult): Promise<void> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

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
  page.drawText('WatchDog Accessibility Report', {
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
    page.drawText(line, {
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
      const titleLines = wrapText(`${i + 1}. ${issue.message}`, contentWidth, 11, helveticaBold);
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

      // WCAG info
      page.drawText(`WCAG ${issue.wcag.id} (${issue.wcag.level}) - ${issue.wcag.name}`, {
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
          ? issue.element.selector.slice(0, 77) + '...'
          : issue.element.selector;
      page.drawText(`Selector: ${selector}`, {
        x: margin,
        y: yPosition,
        size: 9,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 14;

      // Fix description
      const fixLines = wrapText(`Fix: ${issue.fix.description}`, contentWidth, 9, helvetica);
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
  page.drawText(`Generated by WatchDog v1.0.0 on ${new Date().toLocaleString()}`, {
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
