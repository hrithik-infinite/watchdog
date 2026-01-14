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
      <div className="flex-1 flex items-center justify-center p-8 text-center bg-[#1C1C1E]">
        <div>
          <svg
            className="w-16 h-16 mx-auto text-[#3A3A3C] mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-white font-medium mb-1">No issues match your filters</p>
          <p className="text-sm text-[#8E8E93]">Try adjusting your filter criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-[#1C1C1E]">
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
