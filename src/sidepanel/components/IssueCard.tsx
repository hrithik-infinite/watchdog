import type { Issue } from '@/shared/types';
import { SEVERITY_CONFIG } from '@/shared/constants';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHighlight: () => void;
}

export default function IssueCard({ issue, isSelected, onSelect, onHighlight }: IssueCardProps) {
  const config = SEVERITY_CONFIG[issue.severity];

  const truncateHtml = (html: string, maxLength: number = 60) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return html;
    return html.slice(0, maxLength) + '...';
  };

  return (
    <div
      className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors animate-fade-in ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onSelect(issue.id)}
      onMouseEnter={onHighlight}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(issue.id)}
    >
      <div className="flex items-start gap-3">
        {/* Severity indicator */}
        <div
          className="flex-shrink-0 w-2 h-2 mt-2 rounded-full"
          style={{ backgroundColor: config.color }}
          title={config.label}
        />

        <div className="flex-1 min-w-0">
          {/* Severity badge */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: config.bgColor, color: config.color }}
            >
              {config.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              WCAG {issue.wcag.id} ({issue.wcag.level})
            </span>
          </div>

          {/* Issue message */}
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{issue.message}</p>

          {/* Element preview */}
          <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono block truncate">
            {truncateHtml(issue.element.html)}
          </code>
        </div>

        {/* Arrow */}
        <svg
          className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
