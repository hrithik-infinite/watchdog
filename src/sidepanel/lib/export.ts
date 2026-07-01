/**
 * Export utilities for accessibility reports
 * Supports JSON, CSV, HTML, PDF formats and clipboard copy
 */

import { calculateScore } from '@/shared/scoring';
import type { Category, Issue, ScanResult, Severity } from '@/shared/types';
import type { AuditType } from '@/sidepanel/store';
import {
  BRAND_BLUE,
  buildReportHtml,
  CATEGORY_LABELS,
  formatDuration,
  issueStandardLabel,
  SEVERITY_META,
  SEVERITY_ORDER,
  verdictFor,
} from './report-template';

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
  const { PDFDocument, rgb, StandardFonts, LineCapStyle } = await import('pdf-lib');
  const auditLabel = AUDIT_TYPE_LABELS[auditType];

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  const PW = 595; // A4 width in points
  const PH = 842; // A4 height in points
  const M = 50;
  const CW = PW - 2 * M;

  type Rgb = ReturnType<typeof rgb>;
  // Parse a #hex string into a pdf-lib color; returns null for anything else.
  const hexToRgb = (s: string): [number, number, number] | null => {
    const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(s.trim());
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
    const n = Number.parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const col = (hex: string): Rgb => {
    const p = hexToRgb(hex) ?? [0, 0, 0];
    return rgb(p[0], p[1], p[2]);
  };

  const INK = col('#0f172a');
  const SUB = col('#334155');
  const MUTED = col('#64748b');
  const LINE = col('#e2e5e9');
  const SOFT = col('#f1f5f9');
  const CODE_BG = col('#0f172a');
  const CODE_INK = col('#e2e8f0');
  const WHITE = rgb(1, 1, 1);
  const sevColor: Record<Severity, Rgb> = {
    critical: col('#dc2626'),
    serious: col('#ea580c'),
    moderate: col('#d97706'),
    minor: col('#2563eb'),
  };

  const score = calculateScore(result.issues, auditType);
  const gradeColor = col(score.color);
  const total = result.summary.total;
  const counts = result.summary.bySeverity;
  const standards = new Set(result.issues.map((i) => i.standard ?? 'wcag'));
  const reportKind = standards.size > 1 ? 'Website audit' : `${auditLabel} audit`;

  let page = doc.addPage([PW, PH]);
  let y = PH;

  const newPage = () => {
    page = doc.addPage([PW, PH]);
    y = PH - M;
  };
  const need = (h: number) => {
    if (y - h < M + 24) newPage();
  };

  const wrap = (t: string, maxW: number, size: number, f = font): string[] => {
    const words = toPdfSafeText(t).split(' ');
    const out: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxW && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  // Draw wrapped text at the current y, advancing y line by line.
  const para = (
    t: string,
    opts: {
      x?: number;
      size?: number;
      f?: typeof font;
      color?: Rgb;
      maxW?: number;
      lh?: number;
    } = {}
  ) => {
    const { x = M, size = 10, f = font, color = INK, maxW = CW, lh = size + 4 } = opts;
    for (const ln of wrap(t, maxW, size, f)) {
      need(lh);
      page.drawText(ln, { x, y, size, font: f, color });
      y -= lh;
    }
  };

  const fill = (x: number, yy: number, w: number, h: number, color: Rgb, opacity?: number) =>
    page.drawRectangle({ x, y: yy, width: w, height: h, color, opacity });
  const stroke = (x: number, yy: number, w: number, h: number, color: Rgb) =>
    page.drawRectangle({ x, y: yy, width: w, height: h, borderColor: color, borderWidth: 1 });

  // A filled pill with a white uppercase label; returns its width.
  const pill = (text: string, x: number, baselineY: number, bg: Rgb): number => {
    const size = 8;
    const t = toPdfSafeText(text.toUpperCase());
    const w = bold.widthOfTextAtSize(t, size) + 14;
    fill(x, baselineY - 3, w, 15, bg);
    page.drawText(t, { x: x + 7, y: baselineY, size, font: bold, color: WHITE });
    return w;
  };

  // A small uppercase field label.
  const label = (text: string) => {
    need(13);
    page.drawText(toPdfSafeText(text.toUpperCase()), {
      x: M,
      y,
      size: 8,
      font: bold,
      color: MUTED,
    });
    y -= 13;
  };

  // A dark monospace code box (green-tinted for fix snippets); wraps + advances y.
  const codeBox = (code: string, fix = false) => {
    const size = 8.5;
    const pad = 8;
    const lines = wrap(code, CW - pad * 2, size, mono);
    const boxH = lines.length * (size + 3) + pad * 2 - 3;
    need(boxH + 4);
    fill(M, y - boxH, CW, boxH, fix ? col('#052e16') : CODE_BG);
    let ty = y - pad - size + 2;
    for (const ln of lines) {
      page.drawText(ln, {
        x: M + pad,
        y: ty,
        size,
        font: mono,
        color: fix ? col('#bbf7d0') : CODE_INK,
      });
      ty -= size + 3;
    }
    y -= boxH + 8;
  };

  const drawContrast = (issue: Issue) => {
    if (!issue.contrast) return;
    const { fg, bg, ratio, required } = issue.contrast;
    need(32);
    const bgRgb = hexToRgb(bg);
    const fgRgb = hexToRgb(fg);
    if (bgRgb && fgRgb) {
      fill(M, y - 22, 34, 26, rgb(bgRgb[0], bgRgb[1], bgRgb[2]));
      stroke(M, y - 22, 34, 26, LINE);
      page.drawText('Aa', {
        x: M + 8,
        y: y - 15,
        size: 12,
        font: bold,
        color: rgb(fgRgb[0], fgRgb[1], fgRgb[2]),
      });
    }
    const pass = ratio >= required;
    page.drawText(
      toPdfSafeText(
        `${ratio.toFixed(2)}:1 contrast  -  ${pass ? 'passes' : `needs ${required.toFixed(1)}:1`}`
      ),
      { x: M + 44, y: y - 8, size: 9.5, font: bold, color: pass ? col('#16a34a') : col('#dc2626') }
    );
    page.drawText(toPdfSafeText(`Text ${fg} on ${bg}`), {
      x: M + 44,
      y: y - 20,
      size: 8.5,
      font,
      color: MUTED,
    });
    y -= 34;
  };

  // Render a single issue (or a muted "needs review" variant).
  const drawIssue = (issue: Issue, review: boolean, index: number) => {
    need(64);
    para(`${index}. ${issue.message}`, { size: 12, f: bold, color: INK, lh: 15 });

    // Sub-line: severity pill + standard + rule id.
    need(16);
    const pw = pill(SEVERITY_META[issue.severity].label, M, y, sevColor[issue.severity]);
    let sx = M + pw + 8;
    const stdT = toPdfSafeText(issueStandardLabel(issue));
    page.drawText(stdT, { x: sx, y, size: 9, font, color: MUTED });
    sx += font.widthOfTextAtSize(stdT, 9) + 10;
    page.drawText(toPdfSafeText(issue.ruleId), { x: sx, y, size: 8.5, font: mono, color: SUB });
    y -= 16;

    // Metadata chips as one muted line.
    const chips: string[] = [CATEGORY_LABELS[issue.category] ?? issue.category];
    if (typeof issue.ruleNodeCount === 'number' && issue.ruleNodeCount > 1) {
      chips.push(`${issue.ruleNodeCount} elements`);
    }
    if (issue.impact && issue.impact !== issue.severity) chips.push(`Impact: ${issue.impact}`);
    para(chips.join('   -   '), { size: 8.5, color: MUTED, lh: 13 });

    // Why this matters — a light accented box.
    if (issue.whyItMatters) {
      const whyLines = wrap(issue.whyItMatters, CW - 24, 9.5, font);
      const boxH = 13 + whyLines.length * 12 + 6;
      need(boxH + 6);
      fill(M, y - boxH, CW, boxH, col('#eff6ff'));
      fill(M, y - boxH, 3, boxH, col('#2563eb'));
      let wy = y - 12;
      page.drawText('WHY THIS MATTERS', {
        x: M + 12,
        y: wy,
        size: 7.5,
        font: bold,
        color: col('#1d4ed8'),
      });
      wy -= 13;
      for (const ln of whyLines) {
        page.drawText(ln, { x: M + 12, y: wy, size: 9.5, font, color: SUB });
        wy -= 12;
      }
      y -= boxH + 8;
    }

    para(issue.description, { size: 10, color: SUB, lh: 13 });
    drawContrast(issue);

    if (issue.element.failureSummary) {
      label('What axe found');
      para(issue.element.failureSummary.replace(/\n/g, '  '), { size: 9, color: MUTED, lh: 12 });
    }

    y -= 4;
    label('Affected element');
    codeBox(issue.element.html);
    label('CSS selector');
    codeBox(issue.element.selector);

    if (!review) {
      label('How to fix it');
      para(issue.fix.description, { size: 10, color: SUB, lh: 13 });
      if (issue.fix.code) codeBox(issue.fix.code, true);
      const learn = issue.fix.learnMoreUrl || issue.helpUrl;
      if (learn) {
        need(14);
        page.drawText(toPdfSafeText(`Learn more: ${learn}`), {
          x: M,
          y,
          size: 8.5,
          font,
          color: col('#2563eb'),
        });
        y -= 14;
      }
    }

    y -= 6;
    fill(M, y, CW, 1, col('#eef1f4'));
    y -= 14;
  };

  const drawSectionHeader = (
    labelText: string,
    count: number,
    unit: string,
    bg: Rgb,
    blurb: string
  ) => {
    need(28);
    y -= 4;
    const pw = pill(labelText, M, y, bg);
    page.drawText(toPdfSafeText(`${count} ${count === 1 ? unit : `${unit}s`}`), {
      x: M + pw + 10,
      y,
      size: 10,
      font: bold,
      color: INK,
    });
    const cx = M + pw + 10 + bold.widthOfTextAtSize(`${count} ${unit}s`, 10) + 14;
    const bl = wrap(blurb, PW - M - cx, 9, font);
    if (bl[0]) page.drawText(bl[0], { x: cx, y, size: 9, font, color: MUTED });
    y -= 20;
  };

  // ── Header band ──
  fill(0, PH - 70, PW, 70, INK);
  // Brand mark: the hound head filled in brand blue, with the eyes/nose punched
  // back to the header color (drawSvgPath fills solid, so the evenodd holes of the
  // full logo are reproduced with three cut-out circles). Same logo as the app +
  // HTML report.
  const HOUND_HEAD =
    'M6.5 8.8 L4.5 3.1 L10.2 6.1 L13.8 6.1 L19.5 3.1 L17.5 8.8 C18.7 11 18.6 13.9 16.9 16.1 C15.5 17.9 13.9 19.2 12 19.2 C10.1 19.2 8.5 17.9 7.1 16.1 C5.4 13.9 5.3 11 6.5 8.8 Z';
  const HOUND_HOLES: [number, number, number][] = [
    [9.6, 12.4, 1.15],
    [14.4, 12.4, 1.15],
    [12, 15.2, 1.35],
  ];
  const logoScale = 1.35;
  const logoX = M - 4.5 * logoScale;
  const logoY = PH - 35 + 11.15 * logoScale; // vertically centres the hound
  page.drawSvgPath(HOUND_HEAD, { x: logoX, y: logoY, scale: logoScale, color: col(BRAND_BLUE) });
  for (const [ex, ey, er] of HOUND_HOLES) {
    page.drawCircle({
      x: logoX + ex * logoScale,
      y: logoY - ey * logoScale,
      size: er * logoScale,
      color: INK,
    });
  }
  page.drawText('WatchDog', { x: M + 34, y: PH - 44, size: 20, font: bold, color: WHITE });
  const kindT = toPdfSafeText(reportKind.toUpperCase());
  page.drawText(kindT, {
    x: PW - M - font.widthOfTextAtSize(kindT, 9),
    y: PH - 42,
    size: 9,
    font,
    color: col('#cbd5e1'),
  });
  y = PH - 70 - 26;

  // ── Score panel (donut gauge + verdict) — mirrors the HTML report's hero ──
  const panelH = 88;
  need(panelH + 12);
  stroke(M, y - panelH, CW, panelH, LINE);
  const R = 27;
  const ring = 9;
  const gcx = M + 22 + R;
  const gcy = y - panelH / 2;
  page.drawCircle({ x: gcx, y: gcy, size: R, borderColor: LINE, borderWidth: ring });
  // Progress arc as a round-capped polyline from the top, clockwise.
  const frac = Math.max(0, Math.min(1, score.score / 100));
  const steps = Math.max(2, Math.round(frac * 80));
  for (let i = 0; i < steps; i++) {
    const t0 = (i / steps) * frac * 2 * Math.PI;
    const t1 = ((i + 1) / steps) * frac * 2 * Math.PI;
    page.drawLine({
      start: { x: gcx + R * Math.sin(t0), y: gcy + R * Math.cos(t0) },
      end: { x: gcx + R * Math.sin(t1), y: gcy + R * Math.cos(t1) },
      thickness: ring,
      color: gradeColor,
      lineCap: LineCapStyle.Round,
    });
  }
  const gW = bold.widthOfTextAtSize(score.grade, 22);
  page.drawText(score.grade, {
    x: gcx - gW / 2,
    y: gcy + 2,
    size: 22,
    font: bold,
    color: gradeColor,
  });
  const scoreT = `${score.score} / 100`;
  const sW = font.widthOfTextAtSize(scoreT, 8);
  page.drawText(scoreT, { x: gcx - sW / 2, y: gcy - 14, size: 8, font, color: MUTED });
  const tx = gcx + R + 26;
  page.drawText(toPdfSafeText(score.label.toUpperCase()), {
    x: tx,
    y: y - 24,
    size: 9,
    font: bold,
    color: gradeColor,
  });
  page.drawText(toPdfSafeText(`${total} ${total === 1 ? 'issue' : 'issues'} found`), {
    x: tx,
    y: y - 44,
    size: 16,
    font: bold,
    color: INK,
  });
  const verdictLines = wrap(verdictFor(score.grade, total), PW - M - tx, 10, font);
  let vy = y - 60;
  for (const ln of verdictLines.slice(0, 2)) {
    page.drawText(ln, { x: tx, y: vy, size: 10, font, color: MUTED });
    vy -= 13;
  }
  y -= panelH + 18;

  // ── Severity distribution bar + legend ──
  const barH = 10;
  need(barH + 30);
  if (total === 0) {
    fill(M, y - barH, CW, barH, col('#16a34a'));
  } else {
    let segX = M;
    for (const s of SEVERITY_ORDER) {
      if (counts[s] <= 0) continue;
      const segW = (counts[s] / total) * CW;
      fill(segX, y - barH, segW, barH, sevColor[s]);
      segX += segW;
    }
  }
  y -= barH + 14;
  let lx = M;
  for (const s of SEVERITY_ORDER) {
    fill(lx, y - 1, 9, 9, sevColor[s]);
    const t = toPdfSafeText(`${SEVERITY_META[s].label} ${counts[s]}`);
    page.drawText(t, { x: lx + 14, y, size: 9, font, color: SUB });
    lx += 14 + font.widthOfTextAtSize(t, 9) + 22;
  }
  y -= 22;

  // ── Meta ──
  para(`Page: ${result.url}`, { size: 9, color: SUB, lh: 13 });
  para(
    `Scanned ${new Date(result.timestamp).toLocaleString()}   -   Scan time ${formatDuration(result.duration)}   -   ${total} issue${total === 1 ? '' : 's'}${result.incomplete.length ? `   -   ${result.incomplete.length} to review` : ''}`,
    { size: 9, color: MUTED, lh: 13 }
  );
  y -= 6;
  fill(M, y, CW, 1, LINE);
  y -= 16;

  // ── By category ──
  const catRows = (Object.entries(result.summary.byCategory) as [Category, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  if (catRows.length) {
    const maxCat = catRows.reduce((m, [, n]) => Math.max(m, n), 0);
    label('By category');
    for (const [cat, n] of catRows) {
      need(16);
      page.drawText(toPdfSafeText(CATEGORY_LABELS[cat] ?? cat), {
        x: M,
        y,
        size: 9,
        font,
        color: INK,
      });
      const trackX = M + 130;
      const trackW = CW - 130 - 30;
      fill(trackX, y, trackW, 7, SOFT);
      fill(trackX, y, maxCat ? (n / maxCat) * trackW : 0, 7, col('#3b82f6'));
      page.drawText(String(n), { x: M + CW - 18, y, size: 9, font: bold, color: MUTED });
      y -= 16;
    }
    y -= 6;
    fill(M, y, CW, 1, LINE);
    y -= 16;
  }

  // ── Issues ──
  if (total === 0) {
    para('No issues found', { size: 15, f: bold, color: INK, lh: 20 });
    para(`This ${reportKind} completed without flagging any problems.`, { size: 10, color: MUTED });
    y -= 6;
  } else {
    for (const s of SEVERITY_ORDER) {
      const list = result.issues.filter((i) => i.severity === s);
      if (!list.length) continue;
      drawSectionHeader(
        SEVERITY_META[s].label,
        list.length,
        'issue',
        sevColor[s],
        SEVERITY_META[s].blurb
      );
      list.forEach((issue, i) => {
        drawIssue(issue, false, i + 1);
      });
      y -= 4;
    }
  }

  if (result.incomplete.length) {
    drawSectionHeader(
      'Needs review',
      result.incomplete.length,
      'item',
      col('#475569'),
      'Automated checks could not decide these - confirm them by hand.'
    );
    result.incomplete.forEach((issue, i) => {
      drawIssue(issue, true, i + 1);
    });
  }

  // ── Footer + page numbers on every page ──
  const generatedAt = toPdfSafeText(`Generated by WatchDog on ${new Date().toLocaleString()}`);
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(generatedAt, { x: M, y: 28, size: 8, font, color: MUTED });
    const pg = `Page ${i + 1} of ${pages.length}`;
    p.drawText(pg, {
      x: PW - M - font.widthOfTextAtSize(pg, 8),
      y: 28,
      size: 8,
      font,
      color: MUTED,
    });
  });

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
