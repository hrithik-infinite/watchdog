import type { ScanSummary, Severity } from '@/shared/types';
import { SEVERITY_CONFIG } from '@/shared/constants';

interface SummaryProps {
  summary: ScanSummary;
  onFilterBySeverity: (severity: Severity | 'all') => void;
  activeSeverity: Severity | 'all';
}

export default function Summary({ summary, onFilterBySeverity, activeSeverity }: SummaryProps) {
  const severities: Severity[] = ['critical', 'serious', 'moderate', 'minor'];

  return (
    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{summary.total} Issues Found</h2>
        {activeSeverity !== 'all' && (
          <button
            onClick={() => onFilterBySeverity('all')}
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {severities.map((severity) => {
          const config = SEVERITY_CONFIG[severity];
          const count = summary.bySeverity[severity] || 0;
          const isActive = activeSeverity === severity;

          return (
            <button
              key={severity}
              onClick={() => onFilterBySeverity(isActive ? 'all' : severity)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                isActive
                  ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={{
                backgroundColor: isActive ? config.bgColor : undefined,
                ['--tw-ring-color' as string]: config.color,
              }}
            >
              <span className="text-lg font-bold" style={{ color: config.color }}>
                {count}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
