import type { Issue } from '@/shared/types';
import { SEVERITY_CONFIG } from '@/shared/constants';
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
  const config = SEVERITY_CONFIG[issue.severity];

  return (
    <div className="flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">Back to Issues</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Severity badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <span className="text-base">{config.icon}</span>
          {config.label}
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{issue.message}</h2>

        {/* WCAG Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              WCAG {issue.wcag.id} (Level {issue.wcag.level})
            </span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-400">{issue.wcag.name}</p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">{issue.description}</p>
        </div>

        {/* Element */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Element</h3>
            <button
              onClick={onHighlight}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <CodeBlock code={issue.element.html} label="Current HTML" />
        </div>

        {/* Fix Suggestion */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How to Fix</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{issue.fix.description}</p>
          {issue.fix.code && (
            <CodeBlock code={issue.fix.code} label="Suggested Fix" copyLabel="Copy Fix" />
          )}
        </div>

        {/* Learn More */}
        <a
          href={issue.fix.learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Learn More
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Prev
        </button>

        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1} of {totalCount}
        </span>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
