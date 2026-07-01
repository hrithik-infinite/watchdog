/**
 * Scoring utility for WatchDog audits
 * Similar to Lighthouse scoring methodology
 */

import type { AuditType } from './messaging';
import type { Issue, ScanSummary, Severity } from './types';

// Weight multipliers for each severity level
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  serious: 5,
  moderate: 2,
  minor: 1,
};

// Per-audit scale for the scoring curve: the weighted-issue count at which the
// score reaches 25 (the grade-D boundary). A single fixed value scored every
// audit the same despite very different check counts (accessibility ~39 rules vs
// PWA ~7), so a couple of issues tanked a small audit while barely denting
// accessibility. These per-audit values calibrate the curve to each audit's
// scale (correctness-29).
//
// PROVISIONAL: the relative values are a product judgment — validate against real
// scores and tune. Omitting the audit (e.g. a combined multi-scan, or the
// per-category breakdown) uses the audit-agnostic default.
const DEFAULT_MAX_WEIGHTED_ISSUES = 100;
const MAX_WEIGHTED_BY_AUDIT: Partial<Record<AuditType, number>> = {
  accessibility: 100,
  seo: 60,
  'best-practices': 55,
  performance: 45,
  security: 45,
  pwa: 35,
};

function maxWeightedFor(auditType?: AuditType): number {
  return (auditType && MAX_WEIGHTED_BY_AUDIT[auditType]) || DEFAULT_MAX_WEIGHTED_ISSUES;
}

// Map a weighted-issue count to a 0–100 score with an ASYMPTOTIC curve:
//
//   score = 100 · (scale / (scale + weighted))²
//
// It starts at 100 (no issues) and decays toward 0 as issues grow, but never
// actually reaches it — so a worse page always scores below a less-bad one and
// fixing any issue always nudges the number up. (The previous log curve crossed
// 0 at weighted == scale and clamped everything beyond to a flat, uninformative
// 0, giving no progress signal for busy real-world pages.) `scale` is the
// per-audit calibration point where the score is 25 (grade D). Floored at 1 so a
// catastrophic page still differentiates from a merely bad one — never a flat 0.
function scoreFromWeighted(weightedCount: number, auditType?: AuditType): number {
  const scale = maxWeightedFor(auditType);
  const ratio = scale / (scale + weightedCount);
  return Math.max(1, Math.min(100, Math.round(100 * ratio * ratio)));
}

export interface ScoreResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  label: string;
}

/**
 * Calculate score based on issues found.
 * Uses an asymptotic curve (see scoreFromWeighted) so the score decays toward but
 * never reaches 0 — every fix moves the number and worse pages always rank lower.
 */
export function calculateScore(issues: Issue[], auditType?: AuditType): ScoreResult {
  if (issues.length === 0) {
    return {
      score: 100,
      grade: 'A',
      color: '#00C853', // Green
      label: 'Excellent',
    };
  }

  // Calculate weighted issue count
  const weightedCount = issues.reduce((total, issue) => {
    return total + SEVERITY_WEIGHTS[issue.severity];
  }, 0);

  const score = scoreFromWeighted(weightedCount, auditType);

  return {
    score,
    ...getGradeInfo(score),
  };
}

/**
 * Calculate score from summary (when full issues aren't available)
 */
export function calculateScoreFromSummary(
  summary: ScanSummary,
  auditType?: AuditType
): ScoreResult {
  if (summary.total === 0) {
    return {
      score: 100,
      grade: 'A',
      color: '#00C853',
      label: 'Excellent',
    };
  }

  const weightedCount =
    (summary.bySeverity.critical || 0) * SEVERITY_WEIGHTS.critical +
    (summary.bySeverity.serious || 0) * SEVERITY_WEIGHTS.serious +
    (summary.bySeverity.moderate || 0) * SEVERITY_WEIGHTS.moderate +
    (summary.bySeverity.minor || 0) * SEVERITY_WEIGHTS.minor;

  const score = scoreFromWeighted(weightedCount, auditType);

  return {
    score,
    ...getGradeInfo(score),
  };
}

/**
 * Get grade, color, and label based on score
 */
function getGradeInfo(score: number): {
  grade: ScoreResult['grade'];
  color: string;
  label: string;
} {
  if (score >= 90) {
    return { grade: 'A', color: '#00C853', label: 'Excellent' };
  } else if (score >= 75) {
    return { grade: 'B', color: '#64DD17', label: 'Good' };
  } else if (score >= 50) {
    return { grade: 'C', color: '#FFD600', label: 'Needs Work' };
  } else if (score >= 25) {
    return { grade: 'D', color: '#FF9100', label: 'Poor' };
  } else {
    // 'Failing' rather than 'Critical' so the grade label does not collide with
    // the "Critical" severity count shown alongside the gauge.
    return { grade: 'F', color: '#FF3D00', label: 'Failing' };
  }
}

/**
 * Get score breakdown by category
 */
export function getScoreBreakdown(issues: Issue[]): Record<string, ScoreResult> {
  const byCategory: Record<string, Issue[]> = {};

  for (const issue of issues) {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = [];
    }
    byCategory[issue.category].push(issue);
  }

  const breakdown: Record<string, ScoreResult> = {};
  for (const [category, categoryIssues] of Object.entries(byCategory)) {
    breakdown[category] = calculateScore(categoryIssues);
  }

  return breakdown;
}
