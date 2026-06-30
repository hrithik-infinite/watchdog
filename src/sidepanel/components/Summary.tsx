import { Info } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/sidepanel/components/ui/tooltip';
import type { ScanSummary, Severity } from '@/shared/types';
import type { AuditType } from '@/sidepanel/store';
import { cn } from '@/sidepanel/lib/utils';
import { calculateScoreFromSummary } from '@/shared/scoring';
import { useIsSiteOwner, SEVERITY_PLAIN } from '@/sidepanel/lib/persona';
import ScoreGauge from './ScoreGauge';

interface SummaryProps {
  summary: ScanSummary;
  onFilterBySeverity: (severity: Severity | 'all') => void;
  activeSeverity: Severity | 'all';
  // The audit this score is for, so the score uses that audit's calibrated curve.
  // Omitted for a combined multi-scan → the audit-agnostic curve.
  auditType?: AuditType;
}

const SEVERITY_CLASSES: Record<Severity, string> = {
  critical: 'text-critical',
  serious: 'text-serious',
  moderate: 'text-moderate',
  minor: 'text-minor',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
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

  return (
    <div className="flex items-center gap-4 animate-fade-in">
      {/* Score Gauge with a universal "what does this number mean?" explainer */}
      <div className="flex items-center gap-1">
        <ScoreGauge scoreResult={scoreResult} size="sm" showLabel={false} />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="How the score is calculated"
                className="p-0.5 rounded hover:bg-muted/50 transition-colors cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              100 = no problems found. A lower score means more — or more serious — problems.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Severity breakdown */}
      <div className="flex items-center gap-1 flex-1">
        {severities.map((severity) => {
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;

          return (
            <Button
              key={severity}
              variant="ghost"
              aria-pressed={isActive}
              onClick={() => onFilterBySeverity(isActive ? 'all' : severity)}
              className={cn(
                'flex-1 flex flex-col items-center h-auto px-2 py-2 rounded-lg transition-all',
                isActive && 'bg-card ring-2 ring-primary/20 shadow-sm'
              )}
            >
              <span className={cn('text-2xl font-bold leading-none', SEVERITY_CLASSES[severity])}>
                {count}
              </span>
              <span
                className={cn(
                  'text-xs font-medium mt-1.5 leading-none',
                  isActive ? SEVERITY_CLASSES[severity] : 'text-muted-foreground'
                )}
              >
                {SEVERITY_LABELS[severity]}
              </span>
              {/* Plain-language subtitle for the Site-owner audience. Supplements
                  the canonical severity label rather than replacing it, so the
                  accessible name still contains "Critical"/"Serious"/etc. */}
              {isSiteOwner && (
                <span className="text-[9px] leading-tight mt-1 text-center text-muted-foreground/80">
                  {SEVERITY_PLAIN[severity]}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
