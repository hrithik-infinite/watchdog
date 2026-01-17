/**
 * ScanComparison component
 * Shows comparison between current and previous scan
 */

import { useState } from 'react';
import { X, TrendingDown, TrendingUp, Minus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';
import { type ScanComparison, formatRelativeTime } from '@/shared/storage';
import type { Severity } from '@/shared/types';

interface ScanComparisonProps {
  comparison: ScanComparison;
  onClose: () => void;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'text-critical',
  serious: 'text-serious',
  moderate: 'text-moderate',
  minor: 'text-minor',
};

interface DiffStatProps {
  label: string;
  current: number;
  previous: number;
  colorClass?: string;
}

function DiffStat({ label, current, previous, colorClass }: DiffStatProps) {
  const diff = current - previous;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className={cn('text-sm font-medium', colorClass)}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{previous}</span>
        <span className="text-muted-foreground/50">→</span>
        <span className="text-sm font-semibold">{current}</span>
        {diff !== 0 && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              isNegative ? 'text-green-500' : 'text-red-500'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}
            {diff}
          </span>
        )}
        {diff === 0 && (
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Minus className="h-3 w-3" />
            0
          </span>
        )}
      </div>
    </div>
  );
}

export default function ScanComparisonView({ comparison, onClose }: ScanComparisonProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { current, previous, diff, fixedIssues, newIssues, unchangedCount } = comparison;

  const improvementPercent =
    previous.issueCount > 0
      ? Math.round((fixedIssues.length / previous.issueCount) * 100)
      : 0;

  const isImproved = diff.totalDiff < 0;
  const isWorse = diff.totalDiff > 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {isImproved ? (
            <TrendingDown className="h-5 w-5 text-green-500" />
          ) : isWorse ? (
            <TrendingUp className="h-5 w-5 text-red-500" />
          ) : (
            <Minus className="h-5 w-5 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-foreground">Compared to Previous Scan</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Badge */}
      <div className="px-4 py-3 border-b border-border/50">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
            isImproved
              ? 'bg-green-500/10 text-green-500'
              : isWorse
                ? 'bg-red-500/10 text-red-500'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {isImproved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {Math.abs(diff.totalDiff)} issues fixed ({improvementPercent}% improvement)
            </>
          ) : isWorse ? (
            <>
              <AlertCircle className="h-4 w-4" />
              {diff.totalDiff} new issues found
            </>
          ) : (
            <>
              <Minus className="h-4 w-4" />
              No change in issue count
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Comparing to scan from {formatRelativeTime(previous.timestamp)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-3">
        <DiffStat label="Total Issues" current={current.issueCount} previous={previous.issueCount} />
        <DiffStat
          label="Critical"
          current={current.summary.bySeverity.critical}
          previous={previous.summary.bySeverity.critical}
          colorClass={SEVERITY_COLORS.critical}
        />
        <DiffStat
          label="Serious"
          current={current.summary.bySeverity.serious}
          previous={previous.summary.bySeverity.serious}
          colorClass={SEVERITY_COLORS.serious}
        />
        <DiffStat
          label="Moderate"
          current={current.summary.bySeverity.moderate}
          previous={previous.summary.bySeverity.moderate}
          colorClass={SEVERITY_COLORS.moderate}
        />
        <DiffStat
          label="Minor"
          current={current.summary.bySeverity.minor}
          previous={previous.summary.bySeverity.minor}
          colorClass={SEVERITY_COLORS.minor}
        />
      </div>

      {/* Details Toggle */}
      {(fixedIssues.length > 0 || newIssues.length > 0) && (
        <div className="px-4 py-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-center text-xs"
          >
            {showDetails ? 'Hide Details' : 'Show Issue Details'}
          </Button>

          {showDetails && (
            <div className="mt-3 space-y-4">
              {/* Fixed Issues */}
              {fixedIssues.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-green-500 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Fixed Issues ({fixedIssues.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {fixedIssues.slice(0, 5).map((issue) => (
                      <li
                        key={issue.id}
                        className="text-xs text-muted-foreground bg-green-500/5 rounded px-2 py-1.5 line-clamp-1"
                      >
                        <span
                          className={cn(
                            'font-medium mr-1.5',
                            SEVERITY_COLORS[issue.severity]
                          )}
                        >
                          [{issue.severity}]
                        </span>
                        {issue.message}
                      </li>
                    ))}
                    {fixedIssues.length > 5 && (
                      <li className="text-xs text-muted-foreground/60 pl-2">
                        +{fixedIssues.length - 5} more fixed
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* New Issues */}
              {newIssues.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-red-500 mb-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    New Issues ({newIssues.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {newIssues.slice(0, 5).map((issue) => (
                      <li
                        key={issue.id}
                        className="text-xs text-muted-foreground bg-red-500/5 rounded px-2 py-1.5 line-clamp-1"
                      >
                        <span
                          className={cn(
                            'font-medium mr-1.5',
                            SEVERITY_COLORS[issue.severity]
                          )}
                        >
                          [{issue.severity}]
                        </span>
                        {issue.message}
                      </li>
                    ))}
                    {newIssues.length > 5 && (
                      <li className="text-xs text-muted-foreground/60 pl-2">
                        +{newIssues.length - 5} more new issues
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Unchanged count */}
              <p className="text-xs text-muted-foreground/60 text-center pt-2 border-t border-border/30">
                {unchangedCount} issues unchanged
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
