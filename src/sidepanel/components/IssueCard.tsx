import type { Issue, Severity } from '@/shared/types';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHighlight: () => void;
}

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string }> = {
  critical: { bg: '#FF3B30', text: '#FFFFFF' },
  serious: { bg: '#FF9500', text: '#FFFFFF' },
  moderate: { bg: '#FFCC00', text: '#1C1C1E' },
  minor: { bg: '#00C7BE', text: '#1C1C1E' },
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

export default function IssueCard({ issue, isSelected, onSelect, onHighlight }: IssueCardProps) {
  const severityColor = SEVERITY_COLORS[issue.severity];

  const truncateHtml = (html: string, maxLength: number = 80) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return html;
    return html.slice(0, maxLength) + '...';
  };

  return (
    <div
      className={`p-4 bg-[#2C2C2E] rounded-xl mb-3 cursor-pointer transition-all duration-200 animate-fade-in hover:bg-[#3A3A3C] hover:translate-y-[-2px] hover:shadow-lg ${
        isSelected ? 'ring-2 ring-[#007AFF] bg-[#3A3A3C]' : 'border border-transparent'
      }`}
      onClick={() => onSelect(issue.id)}
      onMouseEnter={onHighlight}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(issue.id)}
    >
      {/* Severity Badge */}
      <span
        className="inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3"
        style={{ backgroundColor: severityColor.bg, color: severityColor.text }}
      >
        {SEVERITY_LABELS[issue.severity]}
      </span>

      {/* Issue Title */}
      <h3 className="text-white font-medium mb-2 leading-snug">{issue.message}</h3>

      {/* WCAG Reference */}
      <p className="text-xs text-[#8E8E93] mb-3">
        WCAG {issue.wcag.id} ({issue.wcag.level})
      </p>

      {/* Description */}
      <p className="text-sm text-[#8E8E93] mb-3 line-clamp-2">{issue.description}</p>

      {/* Code Preview */}
      <div className="bg-[#1C1C1E] rounded-lg p-3 mb-3 overflow-hidden">
        <code className="text-xs text-[#66B2FF] font-mono block truncate">
          {truncateHtml(issue.element.html)}
        </code>
      </div>

      {/* Learn More Link */}
      <a
        href={issue.helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-sm text-[#007AFF] hover:text-[#66B2FF] transition-colors"
      >
        Learn more →
      </a>
    </div>
  );
}
