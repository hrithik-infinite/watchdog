import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import type { Issue } from '@/shared/types';
import { Badge } from '@/sidepanel/components/ui/badge';
import { isWcagIssue, STANDARD_LABELS } from '@/sidepanel/lib/standards';

interface IncompleteSectionProps {
  // Items the scanner could not decide automatically (axe "incomplete"): they
  // need a human to confirm. Gated on the "Show Incomplete Issues" setting.
  issues: Issue[];
}

export default function IncompleteSection({ issues }: IncompleteSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (issues.length === 0) return null;

  return (
    <section className="border-t border-border shrink-0">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-accent"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-h3 text-foreground">Needs manual review</span>
        <span className="text-sm text-muted-foreground">({issues.length})</span>
      </button>

      {expanded && (
        <ul className="max-h-64 space-y-2 overflow-y-auto px-4 pb-4">
          {issues.map((issue) => (
            <li key={issue.id} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="minor">Review</Badge>
                <span className="text-mono text-xs text-muted-foreground">
                  {isWcagIssue(issue.standard)
                    ? `WCAG ${issue.wcag.id}`
                    : STANDARD_LABELS[issue.standard ?? 'wcag']}
                </span>
              </div>
              <p className="text-sm text-foreground">{issue.message}</p>
              {issue.element?.selector && (
                <code className="text-mono text-xs text-muted-foreground">
                  {issue.element.selector}
                </code>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
