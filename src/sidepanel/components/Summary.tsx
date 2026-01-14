import { Button } from '@/components/ui/button';
import type { ScanSummary, Severity } from '@/shared/types';
import { cn } from '@/lib/utils';

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

  return (
    <div className="px-5 py-4 bg-background border-b border-border animate-fade-in">
      <div className="flex items-center justify-between">
        {severities.map((severity) => {
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;

          return (
            <Button
              key={severity}
              variant="ghost"
              onClick={() => onFilterBySeverity(isActive ? 'all' : severity)}
              className={cn(
                'flex flex-col items-center h-auto px-4 py-2',
                isActive && 'bg-card ring-1 ring-border'
              )}
            >
              <span className={cn('text-2xl font-bold', SEVERITY_CLASSES[severity])}>{count}</span>
              <span
                className={cn(
                  'text-xs mt-1',
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
