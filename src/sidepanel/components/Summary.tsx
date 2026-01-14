import type { ScanSummary, Severity } from '@/shared/types';

interface SummaryProps {
  summary: ScanSummary;
  onFilterBySeverity: (severity: Severity | 'all') => void;
  activeSeverity: Severity | 'all';
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#FF3B30',
  serious: '#FF9500',
  moderate: '#FFCC00',
  minor: '#00C7BE',
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
    <div className="px-4 py-4 bg-[#1C1C1E] border-b border-[#3A3A3C] animate-fade-in">
      <div className="flex items-center justify-between">
        {severities.map((severity) => {
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;
          const color = SEVERITY_COLORS[severity];

          return (
            <button
              key={severity}
              onClick={() => onFilterBySeverity(isActive ? 'all' : severity)}
              className={`flex flex-col items-center px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#2C2C2E] ring-1 ring-[#3A3A3C]'
                  : 'hover:bg-[#2C2C2E]'
              }`}
            >
              <span
                className="text-2xl font-bold"
                style={{ color }}
              >
                {count}
              </span>
              <span
                className="text-xs mt-1"
                style={{ color: isActive ? color : '#8E8E93' }}
              >
                {SEVERITY_LABELS[severity]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
