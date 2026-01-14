import type { Issue, Severity } from '@/shared/types';
import CodeBlock from './CodeBlock';

interface IssueDetailProps {
  issue: Issue;
  currentIndex: number;
  totalCount: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onHighlight: () => void;
  hasPrev: boolean;
  hasNext: boolean;
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

export default function IssueDetail({
  issue,
  currentIndex,
  totalCount,
  onBack,
  onPrev,
  onNext,
  onHighlight,
  hasPrev,
  hasNext,
}: IssueDetailProps) {
  const severityColor = SEVERITY_COLORS[issue.severity];

  return (
    <div className="flex flex-col h-full animate-slide-in bg-[#1C1C1E]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#3A3A3C]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#007AFF] hover:text-[#66B2FF] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back to Issues</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title and Severity */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white flex-1">{issue.message}</h2>
          <span
            className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ backgroundColor: severityColor.bg, color: severityColor.text }}
          >
            {SEVERITY_LABELS[issue.severity]}
          </span>
        </div>

        {/* WCAG Info */}
        <div className="p-4 bg-[#0A2540] rounded-lg border border-[#1E4976]">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-[#66B2FF]">WCAG Info</span>
          </div>
          <p className="text-white font-medium mb-1">
            WCAG {issue.wcag.id} (Level {issue.wcag.level})
          </p>
          <p className="text-sm text-[#8E8E93]">{issue.description}</p>
        </div>

        {/* Current Element */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Current Element</h3>
            <button
              onClick={onHighlight}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2C2C2E] hover:bg-[#3A3A3C] rounded-lg text-[#007AFF] text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Highlight
            </button>
          </div>
          <CodeBlock code={issue.element.html} />
        </div>

        {/* How to Fix */}
        <div>
          <h3 className="text-sm font-medium text-white mb-2">How to Fix</h3>
          <p className="text-sm text-[#8E8E93] mb-3">{issue.fix.description}</p>
        </div>

        {/* Suggested Fix */}
        {issue.fix.code && (
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Suggested Fix</h3>
            <CodeBlock code={issue.fix.code} showCopy />
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#3A3A3C] bg-[#2C2C2E]">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1.5 text-sm text-[#007AFF] hover:text-[#66B2FF] disabled:text-[#3A3A3C] disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <span className="text-sm text-[#8E8E93]">
          {currentIndex + 1} of {totalCount}
        </span>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-1.5 text-sm text-[#007AFF] hover:text-[#66B2FF] disabled:text-[#3A3A3C] disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
