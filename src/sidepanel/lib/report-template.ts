/**
 * Builds the standalone HTML report a user downloads/shares. Kept separate from
 * export.ts (the download plumbing) so the sizeable template — and its data
 * derivations — live in one focused, testable place. Every page-derived string is
 * escaped; every page-derived URL/color is sanitized.
 */

import { calculateScore } from '@/shared/scoring';
import type { Category, Issue, ScanResult, Severity } from '@/shared/types';
import type { AuditType } from '../store';
import { escapeHtml, safeCssColor, sanitizeUrl } from './html-escape';
import { isWcagIssue, STANDARD_LABELS } from './standards';

const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
};

// Shared with the PDF export (export.ts) so both reports use identical labels.
export const CATEGORY_LABELS: Record<Category, string> = {
  images: 'Images',
  interactive: 'Interactive',
  forms: 'Forms',
  color: 'Color & contrast',
  document: 'Document',
  structure: 'Structure',
  aria: 'ARIA',
  technical: 'Technical',
};

// Order + presentation for each severity. Colors are used as accents (rails,
// pills, bar segments), not big filled cards — a calmer, more professional look.
export const SEVERITY_ORDER: Severity[] = ['critical', 'serious', 'moderate', 'minor'];
export const SEVERITY_META: Record<Severity, { label: string; color: string; blurb: string }> = {
  critical: {
    label: 'Critical',
    color: '#dc2626',
    blurb: 'Blocks people from using core parts of the page.',
  },
  serious: {
    label: 'Serious',
    color: '#ea580c',
    blurb: 'A significant barrier for many visitors.',
  },
  moderate: {
    label: 'Moderate',
    color: '#d97706',
    blurb: 'Real friction that should be addressed.',
  },
  minor: { label: 'Minor', color: '#2563eb', blurb: 'Polish with a limited audience impact.' },
};

// Audit-aware standard label. Only genuine accessibility findings carry a real
// WCAG criterion; every other scanner reuses the `wcag` field with placeholders,
// so keying off `standard` avoids labelling e.g. a Performance issue "WCAG 1.1.1".
export function issueStandardLabel(issue: Issue): string {
  if (isWcagIssue(issue.standard)) {
    return `WCAG ${issue.wcag.id} (${issue.wcag.level})`;
  }
  return STANDARD_LABELS[issue.standard!];
}

export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

// A short verdict line keyed to the grade, so the hero reads as a conclusion.
export function verdictFor(grade: string, total: number): string {
  if (total === 0) return 'No issues detected in this audit — nice work.';
  switch (grade) {
    case 'A':
      return 'In great shape, with only a few small things to tidy up.';
    case 'B':
      return 'Solid overall, with a handful of issues worth fixing.';
    case 'C':
      return 'Workable, but several issues are getting in visitors’ way.';
    case 'D':
      return 'Struggling — meaningful problems are affecting real users.';
    default:
      return 'Failing — critical problems are blocking people right now.';
  }
}

// SVG donut gauge with the letter grade + score in the middle.
function scoreGauge(score: number, grade: string, color: string): string {
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  return `
    <svg class="gauge" width="150" height="150" viewBox="0 0 150 150" role="img"
         aria-label="Score ${score} out of 100, grade ${grade}">
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="#e6e8eb" stroke-width="13" />
      <circle cx="75" cy="75" r="${r}" fill="none" stroke="${color}" stroke-width="13"
              stroke-linecap="round" stroke-dasharray="${circumference.toFixed(1)}"
              stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 75 75)" />
      <text x="75" y="72" text-anchor="middle" font-size="40" font-weight="800"
            fill="${color}" font-family="inherit">${grade}</text>
      <text x="75" y="97" text-anchor="middle" font-size="15" fill="#6b7280"
            font-family="inherit">${score} / 100</text>
    </svg>`;
}

// Stacked, proportional severity bar. Falls back to a full "clear" bar at zero.
function severityBar(counts: Record<Severity, number>, total: number): string {
  if (total === 0) {
    return `<div class="sevbar"><span class="sevbar-seg" style="width:100%;background:#16a34a"></span></div>`;
  }
  const segments = SEVERITY_ORDER.filter((s) => counts[s] > 0)
    .map((s) => {
      const pct = ((counts[s] / total) * 100).toFixed(2);
      return `<span class="sevbar-seg" style="width:${pct}%;background:${SEVERITY_META[s].color}" title="${SEVERITY_META[s].label}: ${counts[s]}"></span>`;
    })
    .join('');
  return `<div class="sevbar">${segments}</div>`;
}

function metaChip(text: string): string {
  return `<span class="chip">${escapeHtml(text)}</span>`;
}

// Convert axe's failureSummary (newline-delimited) into safe, readable HTML.
function failureSummaryHtml(summary: string): string {
  return escapeHtml(summary).replace(/\n/g, '<br>');
}

function contrastBlock(issue: Issue): string {
  if (!issue.contrast) return '';
  const { fg, bg, ratio, required } = issue.contrast;
  const fgSafe = safeCssColor(fg);
  const bgSafe = safeCssColor(bg);
  const pass = ratio >= required;
  return `
    <div class="contrast">
      <span class="swatch" style="background:${bgSafe};color:${fgSafe}">Aa</span>
      <div class="contrast-meta">
        <div><strong>${ratio.toFixed(2)}:1</strong> contrast <span class="contrast-verdict ${pass ? 'ok' : 'bad'}">${pass ? 'passes' : `needs ${required.toFixed(1)}:1`}</span></div>
        <div class="contrast-colors">Text ${escapeHtml(fg)} on ${escapeHtml(bg)}</div>
      </div>
    </div>`;
}

// Render one issue. `review` styles the muted "needs manual review" variant.
function issueCard(issue: Issue, review: boolean): string {
  const sev = SEVERITY_META[issue.severity];
  const chips: string[] = [metaChip(CATEGORY_LABELS[issue.category] ?? issue.category)];
  if (typeof issue.ruleNodeCount === 'number' && issue.ruleNodeCount > 1) {
    chips.push(metaChip(`${issue.ruleNodeCount} elements`));
  }
  if (issue.impact && issue.impact !== issue.severity) {
    chips.push(metaChip(`Impact: ${issue.impact}`));
  }
  const learnMoreUrl = issue.fix.learnMoreUrl || issue.helpUrl;

  return `
    <article class="issue" style="border-left-color:${sev.color}">
      <header class="issue-head">
        <div>
          <div class="issue-title">${escapeHtml(issue.message)}</div>
          <div class="issue-sub">
            <span class="pill" style="background:${sev.color}">${sev.label}</span>
            <span class="std">${escapeHtml(issueStandardLabel(issue))}</span>
            <code class="rule">${escapeHtml(issue.ruleId)}</code>
          </div>
        </div>
      </header>
      <div class="chips">${chips.join('')}</div>
      ${
        issue.whyItMatters
          ? `<div class="why"><div class="why-label">Why this matters</div><div class="why-text">${escapeHtml(issue.whyItMatters)}</div></div>`
          : ''
      }
      <p class="desc">${escapeHtml(issue.description)}</p>
      ${contrastBlock(issue)}
      ${
        issue.element.failureSummary
          ? `<div class="failure"><div class="label">What axe found</div><div class="failure-text">${failureSummaryHtml(issue.element.failureSummary)}</div></div>`
          : ''
      }
      <div class="field">
        <div class="label">Affected element</div>
        <pre class="code">${escapeHtml(issue.element.html)}</pre>
      </div>
      <div class="field">
        <div class="label">CSS selector</div>
        <pre class="code">${escapeHtml(issue.element.selector)}</pre>
      </div>
      ${
        review
          ? ''
          : `<div class="fix">
        <div class="label">How to fix it</div>
        <p class="fix-desc">${escapeHtml(issue.fix.description)}</p>
        ${issue.fix.code ? `<pre class="code code-fix">${escapeHtml(issue.fix.code)}</pre>` : ''}
        ${learnMoreUrl ? `<a class="learn" href="${sanitizeUrl(learnMoreUrl)}" target="_blank" rel="noopener noreferrer">Learn more &rarr;</a>` : ''}
      </div>`
      }
    </article>`;
}

export function buildReportHtml(result: ScanResult, auditType: AuditType): string {
  const counts = result.summary.bySeverity;
  const total = result.summary.total;
  const score = calculateScore(result.issues, auditType);
  const auditLabel = AUDIT_TYPE_LABELS[auditType];

  // A combined multi-scan carries issues from several standards; label it neutrally.
  const standards = new Set(result.issues.map((i) => i.standard ?? 'wcag'));
  const isCombined = standards.size > 1;
  const reportKind = isCombined ? 'Website audit' : `${auditLabel} audit`;

  const issuesBySeverity: Record<Severity, Issue[]> = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  };
  for (const issue of result.issues) issuesBySeverity[issue.severity].push(issue);

  // Category breakdown, most-affected first, for the at-a-glance table.
  const categoryRows = (Object.entries(result.summary.byCategory) as [Category, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryRows.reduce((m, [, n]) => Math.max(m, n), 0);

  const overviewCards = SEVERITY_ORDER.map((s) => {
    const active = counts[s] > 0;
    return `
      <a class="ov ${active ? '' : 'ov-empty'}" href="#sev-${s}">
        <span class="ov-count" style="color:${SEVERITY_META[s].color}">${counts[s]}</span>
        <span class="ov-label">${SEVERITY_META[s].label}</span>
      </a>`;
  }).join('');

  const issueSections =
    total === 0
      ? `<div class="clear"><div class="clear-mark">&#10003;</div><h2>No issues found</h2><p>This ${escapeHtml(reportKind)} completed without flagging any problems.</p></div>`
      : SEVERITY_ORDER.map((severity) => {
          const list = issuesBySeverity[severity];
          if (list.length === 0) return '';
          const meta = SEVERITY_META[severity];
          return `
            <section class="sev-section" id="sev-${severity}">
              <div class="sev-header">
                <span class="pill" style="background:${meta.color}">${meta.label}</span>
                <span class="sev-count">${list.length} ${list.length === 1 ? 'issue' : 'issues'}</span>
                <span class="sev-blurb">${meta.blurb}</span>
              </div>
              ${list.map((issue) => issueCard(issue, false)).join('')}
            </section>`;
        }).join('');

  const incompleteSection =
    result.incomplete.length > 0
      ? `<section class="sev-section" id="needs-review">
          <div class="sev-header">
            <span class="pill pill-review">Needs review</span>
            <span class="sev-count">${result.incomplete.length} ${result.incomplete.length === 1 ? 'item' : 'items'}</span>
            <span class="sev-blurb">Automated checks couldn’t decide these — confirm them by hand.</span>
          </div>
          ${result.incomplete.map((issue) => issueCard(issue, true)).join('')}
        </section>`
      : '';

  const categoryTable = categoryRows.length
    ? `<section class="panel">
        <h2>By category</h2>
        <div class="cat-grid">
          ${categoryRows
            .map(
              ([cat, n]) => `
            <div class="cat-row">
              <span class="cat-name">${CATEGORY_LABELS[cat] ?? cat}</span>
              <span class="cat-track"><span class="cat-fill" style="width:${maxCategory ? ((n / maxCategory) * 100).toFixed(1) : 0}%"></span></span>
              <span class="cat-count">${n}</span>
            </div>`
            )
            .join('')}
        </div>
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WatchDog ${escapeHtml(auditLabel)} Report</title>
  <style>
    :root {
      --bg: #f5f6f8; --surface: #ffffff; --ink: #0f172a; --muted: #64748b;
      --line: #e6e8eb; --line-soft: #eef0f3; --code-bg: #0f172a; --code-ink: #e2e8f0;
      --accent: #2563eb;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: var(--ink); background: var(--bg); line-height: 1.55;
      -webkit-font-smoothing: antialiased; padding: 32px 16px;
    }
    .wrap { max-width: 940px; margin: 0 auto; }
    a { color: var(--accent); }

    /* Header */
    .top {
      background: #0f172a; color: #fff; border-radius: 16px 16px 0 0;
      padding: 28px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; letter-spacing: -0.01em; }
    .brand .mark {
      width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
      background: linear-gradient(140deg, #3b82f6, #1d4ed8); font-size: 15px; font-weight: 800;
    }
    .kind { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
      color: #cbd5e1; background: rgba(255,255,255,.08); padding: 6px 12px; border-radius: 999px; }

    .sheet { background: var(--surface); border: 1px solid var(--line); border-top: 0;
      border-radius: 0 0 16px 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(15,23,42,.06); }

    /* Hero */
    .hero { display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: center;
      padding: 28px 32px; border-bottom: 1px solid var(--line); }
    .hero-verdict { font-size: 15px; color: var(--muted); margin-top: 4px; }
    .hero h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .hero .grade-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
    .sevbar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: var(--line); margin-top: 16px; }
    .sevbar-seg { display: block; height: 100%; }
    .overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
    .ov { display: flex; flex-direction: column; align-items: flex-start; text-decoration: none; color: inherit;
      border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; background: #fff; }
    .ov:hover { border-color: #cbd5e1; }
    .ov-count { font-size: 22px; font-weight: 800; line-height: 1; }
    .ov-label { font-size: 12px; color: var(--muted); margin-top: 4px; text-transform: uppercase; letter-spacing: .05em; }
    .ov-empty { opacity: .55; }

    /* Meta strip */
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px 24px; padding: 20px 32px; background: #fafbfc; border-bottom: 1px solid var(--line); }
    .meta-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 600; }
    .meta-value { font-size: 14px; font-weight: 600; word-break: break-word; }
    .meta-value a { text-decoration: none; }

    /* Panels */
    .panel { padding: 24px 32px; border-bottom: 1px solid var(--line); }
    .panel h2 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
      color: var(--muted); margin-bottom: 16px; }
    .cat-grid { display: flex; flex-direction: column; gap: 10px; }
    .cat-row { display: grid; grid-template-columns: 150px 1fr 34px; align-items: center; gap: 12px; }
    .cat-name { font-size: 14px; font-weight: 600; }
    .cat-track { height: 8px; background: var(--line); border-radius: 999px; overflow: hidden; }
    .cat-fill { display: block; height: 100%; background: linear-gradient(90deg, #3b82f6, #6366f1); border-radius: 999px; }
    .cat-count { font-size: 14px; font-weight: 700; text-align: right; color: var(--muted); }

    /* Issues */
    .issues { padding: 8px 32px 8px; }
    .sev-section { padding: 20px 0; border-bottom: 1px solid var(--line-soft); }
    .sev-section:last-child { border-bottom: 0; }
    .sev-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .sev-count { font-size: 15px; font-weight: 700; }
    .sev-blurb { font-size: 13px; color: var(--muted); }
    .pill { display: inline-block; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 11px;
      border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .pill-review { background: #475569; }

    .issue { border: 1px solid var(--line); border-left: 4px solid; border-radius: 12px;
      padding: 18px 20px; margin-bottom: 14px; background: #fff; }
    .issue-head { display: flex; justify-content: space-between; gap: 16px; }
    .issue-title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
    .issue-sub { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .std { font-size: 12px; color: var(--muted); font-weight: 600; }
    .rule { font-size: 12px; color: #475569; background: #f1f5f9; padding: 2px 7px; border-radius: 6px;
      font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .chip { font-size: 12px; font-weight: 600; color: #475569; background: #f1f5f9;
      padding: 4px 10px; border-radius: 999px; }

    .why { border-left: 3px solid var(--accent); background: #eff6ff; border-radius: 0 8px 8px 0;
      padding: 12px 14px; margin: 12px 0; }
    .why-label { font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 3px; }
    .why-text { font-size: 14px; color: #1e293b; }
    .desc { font-size: 14px; color: #334155; margin: 10px 0; }

    .contrast { display: flex; align-items: center; gap: 14px; margin: 12px 0; padding: 12px 14px;
      background: #fafbfc; border: 1px solid var(--line); border-radius: 10px; }
    .swatch { width: 46px; height: 46px; border-radius: 8px; display: grid; place-items: center;
      font-weight: 700; font-size: 17px; border: 1px solid rgba(0,0,0,.08); flex-shrink: 0; }
    .contrast-meta { font-size: 13px; }
    .contrast-colors { color: var(--muted); margin-top: 2px; }
    .contrast-verdict { font-weight: 700; }
    .contrast-verdict.ok { color: #16a34a; } .contrast-verdict.bad { color: #dc2626; }

    .field, .fix, .failure { margin-top: 12px; }
    .label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
    .code { background: var(--code-bg); color: var(--code-ink); padding: 12px 14px; border-radius: 8px;
      font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace; font-size: 12.5px;
      line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
    .code-fix { background: #052e16; color: #bbf7d0; }
    .failure-text { font-size: 13px; color: #475569; background: #fafbfc; border: 1px solid var(--line);
      border-radius: 8px; padding: 10px 12px; }
    .fix { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; }
    .fix-desc { font-size: 14px; color: #14532d; }
    .learn { display: inline-block; margin-top: 10px; font-size: 13px; font-weight: 700; text-decoration: none; }

    .clear { text-align: center; padding: 56px 32px; }
    .clear-mark { width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 50%; background: #dcfce7;
      color: #16a34a; font-size: 30px; display: grid; place-items: center; }
    .clear h2 { font-size: 20px; font-weight: 800; } .clear p { color: var(--muted); margin-top: 6px; }

    .foot { padding: 22px 32px; text-align: center; color: var(--muted); font-size: 13px; background: #fafbfc; }
    .foot a { text-decoration: none; }

    @media (max-width: 640px) {
      .hero { grid-template-columns: 1fr; text-align: left; }
      .cat-row { grid-template-columns: 110px 1fr 30px; }
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet, .top { box-shadow: none; }
      .issue, .sev-section, .panel { page-break-inside: avoid; }
      .ov:hover { border-color: var(--line); }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="brand"><span class="mark">W</span> WatchDog</div>
      <span class="kind">${escapeHtml(reportKind)}</span>
    </div>

    <div class="sheet">
      <div class="hero">
        <div>${scoreGauge(score.score, score.grade, score.color)}</div>
        <div>
          <div class="grade-label" style="color:${score.color}">${escapeHtml(score.label)}</div>
          <h1>${total} ${total === 1 ? 'issue' : 'issues'} found</h1>
          <div class="hero-verdict">${verdictFor(score.grade, total)}</div>
          ${severityBar(counts, total)}
          <div class="overview">${overviewCards}</div>
        </div>
      </div>

      <div class="meta">
        <div class="meta-item">
          <span class="meta-label">Page</span>
          <span class="meta-value"><a href="${sanitizeUrl(result.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.url)}</a></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Scanned</span>
          <span class="meta-value">${escapeHtml(new Date(result.timestamp).toLocaleString())}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Scan time</span>
          <span class="meta-value">${formatDuration(result.duration)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Issues</span>
          <span class="meta-value">${total}${result.incomplete.length ? ` &middot; ${result.incomplete.length} to review` : ''}</span>
        </div>
      </div>

      ${categoryTable}

      <div class="issues">
        ${issueSections}
        ${incompleteSection}
      </div>

      <div class="foot">
        Generated by WatchDog on ${escapeHtml(new Date().toLocaleString())}
        &middot; <a href="${sanitizeUrl(result.url)}" target="_blank" rel="noopener noreferrer">Open the page</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
