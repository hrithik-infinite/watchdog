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
    <div className="px-4 py-6 bg-[#1C1C1E] border-b border-[#2C2C2E] animate-fade-in">
      <div className="grid grid-cols-4 gap-2">
        {severities.map((severity) => {
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;
          const color = SEVERITY_COLORS[severity];

          return (
            <button
              key={severity}
              onClick={() => onFilterBySeverity(isActive ? 'all' : severity)}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#2C2C2E] shadow-inner scale-95'
                  : 'hover:bg-[#2C2C2E] hover:scale-105'
              }`}
            >
              <span
                className="text-3xl font-black mb-1"
                style={{ color, textShadow: isActive ? `0 0 12px ${color}40` : 'none' }}
              >
                {count}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
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
