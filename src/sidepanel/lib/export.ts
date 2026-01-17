/**
 * Export utilities for accessibility reports
 * Supports JSON, CSV, HTML, and PDF formats
 */

import type { ScanResult, Issue, Severity } from '@/shared/types';

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
 * Capture screenshot of the current page
 */
async function captureScreenshot(): Promise<string> {
  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      resolve(dataUrl || '');
    });
  });
}

/**
 * Export scan results as PDF
 */
export async function exportPDF(result: ScanResult): Promise<void> {
  // Dynamically import jsPDF to avoid loading it unless needed
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WatchDog Accessibility Report', margin, 25);

  yPosition = 50;

  // Metadata
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`URL: ${result.url}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Date: ${new Date(result.timestamp).toLocaleString()}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Scan Duration: ${result.duration.toFixed(0)}ms`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Issues: ${result.summary.total}`, margin, yPosition);
  yPosition += 12;

  // Try to capture and add screenshot
  try {
    const screenshot = await captureScreenshot();
    if (screenshot) {
      checkPageBreak(80);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Screenshot', margin, yPosition);
      yPosition += 8;

      // Add screenshot (scaled to fit)
      const imgWidth = contentWidth;
      const imgHeight = 120;
      doc.addImage(screenshot, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 12;
    }
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
  }

  // Summary
  checkPageBreak(50);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPosition);
  yPosition += 10;

  const severities: Array<{ key: Severity; label: string; color: [number, number, number] }> = [
    { key: 'critical', label: 'Critical', color: [220, 38, 38] },
    { key: 'serious', label: 'Serious', color: [234, 88, 12] },
    { key: 'moderate', label: 'Moderate', color: [202, 138, 4] },
    { key: 'minor', label: 'Minor', color: [37, 99, 235] },
  ];

  severities.forEach(({ key, label, color }) => {
    const count = result.summary.bySeverity[key];
    doc.setFillColor(...color);
    doc.rect(margin, yPosition - 5, 5, 5, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}: ${count}`, margin + 8, yPosition);
    yPosition += 7;
  });

  yPosition += 8;

  // Issues by severity
  for (const { key: severity, label } of severities) {
    const issues = result.issues.filter((i) => i.severity === severity);
    if (issues.length === 0) continue;

    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} Issues (${issues.length})`, margin, yPosition);
    yPosition += 8;

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      checkPageBreak(40);

      // Issue number and message
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const issueTitle = `${i + 1}. ${issue.message}`;
      const titleLines = doc.splitTextToSize(issueTitle, contentWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 5 + 3;

      // WCAG info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `WCAG ${issue.wcag.id} (${issue.wcag.level}) - ${issue.wcag.name}`,
        margin,
        yPosition
      );
      yPosition += 6;

      // Element selector
      doc.setTextColor(0, 0, 0);
      doc.text(`Selector: ${issue.element.selector}`, margin, yPosition);
      yPosition += 6;

      // Fix description
      const fixLines = doc.splitTextToSize(`Fix: ${issue.fix.description}`, contentWidth);
      doc.text(fixLines, margin, yPosition);
      yPosition += fixLines.length * 4 + 8;
    }

    yPosition += 5;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerY = pageHeight - 10;
  doc.text(
    `Generated by WatchDog v1.0.0 on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Save PDF
  const filename = `watchdog-report-${formatTimestamp(result.timestamp)}.pdf`;
  doc.save(filename);
}
