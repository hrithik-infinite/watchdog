import { Search } from 'lucide-react';
import type { Issue, Severity } from '@/shared/types';
import IssueCard from './IssueCard';

interface IssueListProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
  onHighlightIssue: (selector: string, severity: Severity) => void;
  canHighlight?: boolean;
  autoHighlight?: boolean;
}

export default function IssueList({
  issues,
  selectedIssueId,
  onSelectIssue,
  onHighlightIssue,
  canHighlight = false,
  autoHighlight = true,
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center bg-background">
        <div>
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
          <p className="text-foreground font-medium mb-1">No issues match your filters</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filter criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-background">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          isSelected={selectedIssueId === issue.id}
          onSelect={onSelectIssue}
          onHighlight={() => onHighlightIssue(issue.element.selector, issue.severity)}
          canHighlight={canHighlight}
          autoHighlight={autoHighlight}
        />
      ))}
    </div>
  );
}
