import { Info } from 'lucide-react';
import { calculateScoreFromSummary } from '@/shared/scoring';
import type { ScanSummary, Severity } from '@/shared/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/sidepanel/components/ui/tooltip';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import { cn } from '@/sidepanel/lib/utils';
import type { AuditType } from '@/sidepanel/store';
import ScoreGauge from './ScoreGauge';

interface SummaryProps {
  summary: ScanSummary;
  onFilterBySeverity: (severity: Severity | 'all') => void;
  activeSeverity: Severity | 'all';
  // The audit this score is for, so the score uses that audit's calibrated curve.
  // Omitted for a combined multi-scan → the audit-agnostic curve.
  auditType?: AuditType;
}

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

// Soft-chip classes for the active (filtered) severity, and the always-on dot.
const SEVERITY_CHIP_ACTIVE: Record<Severity, string> = {
  critical: 'border-critical/40 bg-critical/15 text-critical',
  serious: 'border-serious/40 bg-serious/15 text-serious',
  moderate: 'border-moderate/40 bg-moderate/15 text-moderate',
  minor: 'border-minor/40 bg-minor/15 text-minor',
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-critical',
  serious: 'bg-serious',
  moderate: 'bg-moderate',
  minor: 'bg-minor',
};

const AUDIT_LABELS: Partial<Record<AuditType, string>> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
};

export default function Summary({
  summary,
  onFilterBySeverity,
  activeSeverity,
  auditType,
}: SummaryProps) {
  const severities: Severity[] = ['critical', 'serious', 'moderate', 'minor'];
  const scoreResult = calculateScoreFromSummary(summary, auditType);
  const isSiteOwner = useIsSiteOwner();
  const total = summary.total;

  // Verdict beside the gauge. The gauge ring is neutral, so the score is never
  // communicated by color alone — the verdict word/count carries the meaning.
  // Site owners get a plain verdict + "Score N / 100"; developers get the audit
  // name + an issue count.
  const verdict = isSiteOwner
    ? scoreResult.label
    : (auditType && AUDIT_LABELS[auditType]) || 'Score';
  const subline = isSiteOwner
    ? `Score ${scoreResult.score} / 100`
    : `${total} ${total === 1 ? 'issue' : 'issues'}`;

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0 animate-fade-in">
      {/* Score + verdict */}
      <div className="flex items-center gap-3">
        <ScoreGauge scoreResult={scoreResult} size="sm" showLabel={false} tone="neutral" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-h3 text-foreground truncate">{verdict}</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="How the score is calculated"
                    className="inline-flex items-center justify-center size-6 rounded-md hover:bg-accent transition-colors cursor-help text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Every page starts at 100. Each issue subtracts points by severity and how many
                  elements it hits — Critical weighs most.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums truncate">{subline}</p>
        </div>
      </div>

      {/* Severity breakdown — filter chips (the only place severity is filtered). */}
      <div className="flex flex-wrap items-center gap-1.5">
        {severities.map((severity) => {
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;
          return (
            <button
              key={severity}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterBySeverity(isActive ? 'all' : severity)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                isActive
                  ? SEVERITY_CHIP_ACTIVE[severity]
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', SEVERITY_DOT[severity])} />
              <span className="tabular-nums">{count}</span> {SEVERITY_LABELS[severity]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
