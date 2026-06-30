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

// Weighted-issue count at which the score reaches 0 (defines the log curve).
// A single fixed value scored every audit on the same curve despite them running
// very different numbers of checks (accessibility ~39 rules vs PWA ~7), so a
// couple of issues tanked a small audit while barely denting accessibility. These
// per-audit ceilings calibrate the curve to each audit's scale (correctness-29).
//
// PROVISIONAL: the relative values are a product judgment — validate against real
// scores and tune. Omitting the audit (e.g. a combined multi-scan, or the
// per-category breakdown) keeps the original audit-agnostic curve.
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

export interface ScoreResult {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  label: string;
}

/**
 * Calculate score based on issues found
 * Uses a logarithmic scale to prevent immediate 0 scores
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

  // Use logarithmic scaling for smoother curve, with a per-audit ceiling.
  const max = maxWeightedFor(auditType);
  const logScore = 100 * (1 - Math.log(1 + weightedCount) / Math.log(1 + max));
  const score = Math.max(0, Math.min(100, Math.round(logScore)));

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

  const max = maxWeightedFor(auditType);
  const logScore = 100 * (1 - Math.log(1 + weightedCount) / Math.log(1 + max));
  const score = Math.max(0, Math.min(100, Math.round(logScore)));

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
