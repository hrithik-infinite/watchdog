import { Button } from '@/sidepanel/components/ui/button';
import type { ScanSummary, Severity } from '@/shared/types';
import { cn } from '@/sidepanel/lib/utils';
import { calculateScoreFromSummary } from '@/shared/scoring';
import ScoreGauge from './ScoreGauge';

interface SummaryProps {
  summary: ScanSummary;
  onFilterBySeverity: (severity: Severity | 'all') => void;
  activeSeverity: Severity | 'all';
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

export default function Summary({ summary, onFilterBySeverity, activeSeverity }: SummaryProps) {
  const severities: Severity[] = ['critical', 'serious', 'moderate', 'minor'];
  const scoreResult = calculateScoreFromSummary(summary);

  return (
    <div className="flex items-center gap-4 animate-fade-in">
      {/* Score Gauge */}
      <ScoreGauge scoreResult={scoreResult} size="sm" showLabel={false} />

      {/* Severity breakdown */}
      <div className="flex items-center gap-1 flex-1">
        {severities.map((severity) => {
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;

          return (
            <Button
              key={severity}
              variant="ghost"
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
            </Button>
          );
        })}
      </div>
    </div>
  );
}
