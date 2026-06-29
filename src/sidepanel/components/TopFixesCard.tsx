/**
 * "Top fixes" action card (ux-public-11).
 *
 * Groups the current (filtered) issues by ruleId, ranks each group by
 * severity × count, and surfaces the 3–5 highest-impact actions in plain
 * language with a count. For a non-developer this turns a paralyzing list into a
 * starting point: "fix these few things first". Pure derived view of data the
 * store already holds — clicking a row opens the first issue in that group.
 */

import { useMemo } from 'react';
import { Wrench, ChevronRight } from 'lucide-react';
import type { Issue, Severity } from '@/shared/types';
import { cn } from '@/sidepanel/lib/utils';

interface TopFixesCardProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  /** How many fix groups to show. */
  max?: number;
}

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  serious: 5,
  moderate: 2,
  minor: 1,
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

const SEVERITY_PILL: Record<Severity, string> = {
  critical: 'bg-critical/15 text-critical',
  serious: 'bg-serious/15 text-serious',
  moderate: 'bg-moderate/15 text-moderate',
  minor: 'bg-minor/15 text-minor',
};

interface FixGroup {
  ruleId: string;
  count: number;
  topSeverity: Severity;
  representative: Issue;
}

function buildGroups(issues: Issue[]): FixGroup[] {
  const byRule = new Map<string, Issue[]>();
  for (const issue of issues) {
    const list = byRule.get(issue.ruleId);
    if (list) list.push(issue);
    else byRule.set(issue.ruleId, [issue]);
  }

  const groups: FixGroup[] = [];
  for (const [ruleId, list] of byRule) {
    // Representative = the most severe instance, so the row leads with the
    // worst case and clicking opens the highest-priority element.
    const representative = list.reduce((worst, current) =>
      SEVERITY_ORDER[current.severity] < SEVERITY_ORDER[worst.severity] ? current : worst
    );
    groups.push({
      ruleId,
      count: list.length,
      topSeverity: representative.severity,
      representative,
    });
  }

  // Rank by impact: severity weight × how many elements are affected.
  groups.sort(
    (a, b) =>
      SEVERITY_WEIGHTS[b.topSeverity] * b.count - SEVERITY_WEIGHTS[a.topSeverity] * a.count
  );
  return groups;
}

export default function TopFixesCard({ issues, onSelectIssue, max = 4 }: TopFixesCardProps) {
  const groups = useMemo(() => buildGroups(issues), [issues]);

  // Nothing useful to surface (e.g. a single issue) — let the list speak.
  if (groups.length < 2) return null;

  const top = groups.slice(0, max);

  return (
    <section
      aria-labelledby="top-fixes-heading"
      className="px-4 py-3 border-b border-border/40 bg-card/30"
    >
      <div className="flex items-center gap-2 mb-1">
        <Wrench className="h-4 w-4 text-primary" />
        <h3 id="top-fixes-heading" className="text-h3 text-foreground">
          Top fixes
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2.5">
        Start with the changes that affect the most visitors.
      </p>

      <ul className="space-y-1.5">
        {top.map((group) => (
          <li key={group.ruleId}>
            <button
              type="button"
              onClick={() => onSelectIssue(group.representative.id)}
              aria-label={`${group.representative.message} — ${group.count} ${
                group.count === 1 ? 'place' : 'places'
              }. Open first.`}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border/40 bg-background/40 text-left hover:bg-accent hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={cn(
                  'flex-shrink-0 min-w-[1.75rem] text-center text-xs font-bold px-1.5 py-0.5 rounded',
                  SEVERITY_PILL[group.topSeverity]
                )}
              >
                {group.count}
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-sm text-foreground block truncate">
                  {group.representative.message}
                </span>
                {group.representative.whyItMatters && (
                  <span className="text-xs text-muted-foreground block truncate">
                    {group.representative.whyItMatters}
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
