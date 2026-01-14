import type { Issue, Severity } from '@/shared/types';
import IssueCard from './IssueCard';

interface IssueListProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onHighlightIssue: (selector: string, severity: Severity) => void;
}

export default function IssueList({
  issues,
  selectedIssueId,
  onSelectIssue,
  onHighlightIssue,
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-500">No issues match your filters</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filter criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isSelected={selectedIssueId === issue.id}
          onSelect={onSelectIssue}
          onHighlight={() => onHighlightIssue(issue.element.selector, issue.severity)}
        />
      ))}
    </div>
  );
}
