/**
 * ScanHistory component
 * Shows timeline of past scans for the current domain
 */

import { useState } from 'react';
import { History, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';
import { type ScanHistoryEntry, formatRelativeTime, clearDomainHistory } from '@/shared/storage';

interface ScanHistoryProps {
  history: ScanHistoryEntry[];
  onRefresh: () => void;
}

export default function ScanHistory({ history, onRefresh }: ScanHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  // Calculate overall improvement
  const firstScan = history[history.length - 1];
  const latestScan = history[0];
  const totalImprovement = firstScan.issueCount - latestScan.issueCount;
  const improvementPercent =
    firstScan.issueCount > 0
      ? Math.round((totalImprovement / firstScan.issueCount) * 100)
      : 0;

  const handleClearHistory = async () => {
    if (confirm('Clear all scan history for this domain?')) {
      await clearDomainHistory(latestScan.url);
      onRefresh();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Scan History</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Overall trend indicator */}
          {history.length > 1 && (
            <span
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                totalImprovement > 0
                  ? 'text-green-500'
                  : totalImprovement < 0
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              )}
            >
              {totalImprovement > 0 ? (
                <>
                  <TrendingDown className="h-3 w-3" />-{totalImprovement}
                </>
              ) : totalImprovement < 0 ? (
                <>
                  <TrendingUp className="h-3 w-3" />+{Math.abs(totalImprovement)}
                </>
              ) : (
                <Minus className="h-3 w-3" />
              )}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Timeline */}
          <div className="px-4 py-3">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              {/* Timeline items */}
              <ul className="space-y-3">
                {history.map((entry, index) => {
                  const isLatest = index === 0;
                  const prevEntry = history[index + 1];
                  const diff = prevEntry ? prevEntry.issueCount - entry.issueCount : 0;

                  return (
                    <li key={entry.id} className="relative pl-6">
                      {/* Dot indicator */}
                      <div
                        className={cn(
                          'absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2',
                          isLatest
                            ? 'bg-primary border-primary'
                            : 'bg-background border-muted-foreground/30'
                        )}
                      />

                      {/* Content */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(entry.timestamp)}
                            {isLatest && (
                              <span className="ml-1.5 text-primary font-medium">(current)</span>
                            )}
                          </p>
                          <p className="text-sm font-medium">
                            {entry.issueCount} issues
                            {entry.auditTypes.length > 1 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({entry.auditTypes.length} audits)
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Diff badge */}
                        {prevEntry && diff !== 0 && (
                          <span
                            className={cn(
                              'text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5',
                              diff > 0
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                            )}
                          >
                            {diff > 0 ? (
                              <>
                                <TrendingDown className="h-3 w-3" />-{diff}
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3" />+{Math.abs(diff)}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Footer with total improvement */}
          {history.length > 1 && (
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Total improvement:{' '}
                  <span
                    className={cn(
                      'font-medium',
                      totalImprovement > 0
                        ? 'text-green-500'
                        : totalImprovement < 0
                          ? 'text-red-500'
                          : 'text-foreground'
                    )}
                  >
                    {totalImprovement > 0 ? '-' : totalImprovement < 0 ? '+' : ''}
                    {Math.abs(totalImprovement)} issues ({Math.abs(improvementPercent)}%)
                  </span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
